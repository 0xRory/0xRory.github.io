import { CDP, httpJson, sleep } from './cdp.mjs';
const W = Number(process.env.W || 390), H = Number(process.env.H || 844);
const RM = process.env.RM === '1';
const t = (await httpJson(Number(process.env.CDP_PORT), '/json/list')).find(x => x.type === 'page');
const cdp = await new CDP(t.webSocketDebuggerUrl).connect();
const errs = [], warns = [];
cdp.on('Runtime.consoleAPICalled', p => { const s = p.args.map(a=>a.value??a.description??'').join(' ');
  if (p.type==='error') errs.push(s); if (p.type==='warning') warns.push(s); });
cdp.on('Runtime.exceptionThrown', p => errs.push(p.exceptionDetails.text));
await cdp.send('Runtime.enable'); await cdp.send('Network.enable'); await cdp.send('Page.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: W<700?3:1, mobile: W<700 });
if (RM) await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await cdp.send('Page.navigate', { url: process.env.PAGE });
await sleep(3000);
const q = async e => { try { return await cdp.eval(e); } catch (err) { return 'ERR ' + err.message.slice(0,120); } };
const res = [];
const ok = (c,m) => { res.push(c); console.log((c?'PASS  ':'FAIL  ')+m); };

console.log(`--- ${W}x${H}${RM ? '  prefers-reduced-motion: reduce' : ''} ---`);
const of_ = await q('({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth})');
ok(of_.s <= of_.c + 1, `no horizontal overflow (${of_.s} vs ${of_.c})`);
const nav = await q('(()=>{const n=document.querySelector(".nav__links");return {sw:n.scrollWidth,cw:n.clientWidth}})()');
ok(true, `nav links ${nav.sw}px in ${nav.cw}px ${nav.sw>nav.cw?'(scrolls)':'(fits)'}`);
ok(await q('document.documentElement.classList.contains("js")'), 'boot ran');

// walk the whole page so every reveal has a chance
const hgt = await q('document.documentElement.scrollHeight');
for (let y = 0; y <= hgt; y += 400) { await q(`window.scrollTo(0,${y})`); await sleep(70); }
await sleep(900);
const hidden = await q('[...document.querySelectorAll("[data-reveal]")].filter(e=>+getComputedStyle(e).opacity<0.9).length');
ok(hidden === 0, `every reveal resolved after a full scroll (${hidden} stuck)`);

if (RM) {
  ok(await q('!document.querySelector("[data-cursor]").classList.contains("is-live")'), 'custom cursor not mounted');
  ok(await q('getComputedStyle(document.querySelector("[data-cursor]")).display === "none"'), 'cursor display:none');
  const cv = await q('(()=>{const c=document.querySelector("[data-hero-canvas]");return {live:c.classList.contains("is-live"),w:c.width}})()');
  ok(cv.live && cv.w > 0, 'hero canvas still renders one static frame');
  await q('window.scrollTo(0,0)'); await sleep(300);
  await q(`document.querySelector('a[href="#contact"]').click()`); await sleep(800);
  ok(await q('window.scrollY') > 100, 'anchor still navigates without motion');
}
if (W < 700) {
  // CDP cannot emulate the hover/pointer media features in this Chrome, so
  // assert the rule exists rather than its computed effect.
  const rule = await q(`[...document.styleSheets].flatMap(ss=>{try{return [...ss.cssRules]}catch{return []}})
    .some(r => r.conditionText && r.conditionText.includes('hover: none') && r.cssText.includes('.cursor'))`);
  ok(rule === true, 'a (hover: none) rule hides the custom cursor');
  ok(await q('!document.querySelector("[data-cursor]").classList.contains("is-live")'), 'cursor not activated without pointermove');
  const hw = await q('Math.round(document.querySelector(".hero__canvas-wrap").getBoundingClientRect().width)');
  ok(hw <= 288 + 1, `hero canvas capped at 18rem (${hw}px)`);
}
ok(errs.length === 0, `no errors (${errs.length})`); errs.forEach(e=>console.log('      ! '+e.slice(0,140)));
ok(warns.length === 0, `no warnings (${warns.length})`); warns.forEach(e=>console.log('      ! '+e.slice(0,140)));
console.log(`${res.filter(Boolean).length} passed, ${res.filter(r=>!r).length} failed\n`);
cdp.close(); process.exit(res.every(Boolean) ? 0 : 1);
