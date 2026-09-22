// Minimal Chrome DevTools Protocol client: no deps, raw WebSocket over net+crypto.
import net from 'node:net';
import crypto from 'node:crypto';
import http from 'node:http';

export function httpJson(port, path) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port, path }, (r) => {
      let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
    }).on('error', rej);
  });
}

export class CDP {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }

  connect() {
    const u = new URL(this.url);
    const key = crypto.randomBytes(16).toString('base64');
    return new Promise((resolve, reject) => {
      const sock = net.connect(Number(u.port), u.hostname, () => {
        sock.write(
          `GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\n` +
          `Connection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
      });
      this.sock = sock;
      let buf = Buffer.alloc(0), upgraded = false;
      sock.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        if (!upgraded) {
          const i = buf.indexOf('\r\n\r\n');
          if (i === -1) return;
          upgraded = true; buf = buf.subarray(i + 4); resolve(this);
        }
        for (;;) {
          const frame = readFrame(buf);
          if (!frame) break;
          buf = frame.rest;
          if (frame.opcode === 1) this._onMessage(frame.payload.toString('utf8'));
        }
      });
      sock.on('error', reject);
    });
  }

  _onMessage(raw) {
    const msg = JSON.parse(raw);
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      (this.handlers.get(msg.method) || []).forEach((h) => h(msg.params));
    }
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  send(method, params = {}) {
    const id = ++this.id;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.sock.write(writeFrame(Buffer.from(payload, 'utf8')));
    });
  }

  async eval(expression, awaitPromise = true) {
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise, returnByValue: true, userGesture: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  }

  close() { try { this.sock.destroy(); } catch {} }
}

function writeFrame(payload) {
  const len = payload.length;
  let header;
  if (len < 126) header = Buffer.from([0x81, 0x80 | len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0xFE; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0xFF; header.writeBigUInt64BE(BigInt(len), 2); }
  const mask = crypto.randomBytes(4);
  const masked = Buffer.from(payload);
  for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i & 3];
  return Buffer.concat([header, mask, masked]);
}

function readFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  let len = buf[1] & 0x7f, off = 2;
  if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); off = 4; }
  else if (len === 127) { if (buf.length < 10) return null; len = Number(buf.readBigUInt64BE(2)); off = 10; }
  if (buf.length < off + len) return null;
  return { opcode, payload: buf.subarray(off, off + len), rest: buf.subarray(off + len) };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
