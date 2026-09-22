/**
 * Hero scanline / glitch dissolve.
 *
 * Technique: the portrait is dithered once to 1-bit, cached as an ImageBitmap,
 * then redrawn every frame as N horizontal slices with a per-slice horizontal
 * displacement. One canvas layer, one texture, ~0.5ms/frame on a laptop.
 *
 * The displacement amplitude is a GSAP-tweened scalar, never per-frame
 * Math.random() — choreographed glitches read as intent, noise reads as broken.
 *
 * This module registers the page's only per-frame callback, on gsap.ticker.
 */

import { reduced, onMotionPrefChange } from './motion-prefs.js';

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function initHeroScanlines({ gsap, ScrollTrigger }) {
  const canvas = document.querySelector('[data-hero-canvas]');
  const fallback = document.querySelector('.hero__fallback');
  const wrap = document.querySelector('.hero__canvas-wrap');
  if (!canvas || !fallback || !wrap) return;

  const saveData = navigator.connection?.saveData === true;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;                       // no 2d context: the <img> stands in

  const state = { amp: 0 };
  let bitmap = null;
  let burst = [];
  let slices = 48;
  let running = false;
  let tickerFn = null;
  let idleTl = null;

  const isMobile = () => window.innerWidth < 768;

  /* ── build the 1-bit source ───────────────────────────────────── */

  async function buildBitmap() {
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--ink').trim() || '#0a0a0a';
    const paper = styles.getPropertyValue('--paper').trim() || '#f2f2f0';

    // Bake at device-pixel resolution (capped) so the 1-bit grid lands 1:1 on
    // real pixels. Baking at CSS size and upscaling produced a checkerboard
    // moire in flat areas.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(Math.min((wrap.clientWidth || 600) * dpr, isMobile() ? 900 : 1600));
    const h = w;

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.imageSmoothingEnabled = false;
    octx.drawImage(fallback, 0, 0, w, h);

    const img = octx.getImageData(0, 0, w, h);
    const d = img.data;
    const [ir, ig, ib] = parseColor(ink, octx);
    const [pr, pg, pb] = parseColor(paper, octx);

    for (let y = 0; y < h; y++) {
      const row = BAYER4[y & 3];
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
        const on = lum > (row[x & 3] + 0.5) / 16;
        d[i] = on ? pr : ir;
        d[i + 1] = on ? pg : ig;
        d[i + 2] = on ? pb : ib;
        d[i + 3] = on ? 0 : 255;   // paper stays transparent so the page shows through
      }
    }
    octx.putImageData(img, 0, 0);

    bitmap = await createImageBitmap(off);
    sizeCanvas();
  }

  function parseColor(css, c) {
    c.fillStyle = '#000';
    c.fillStyle = css;
    const hex = c.fillStyle;
    if (hex.startsWith('#')) {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = hex.match(/[\d.]+/g) || [0, 0, 0];
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    slices = isMobile() ? 24 : 48;
    burst = new Array(slices).fill(0);
  }

  /* ── the frame ────────────────────────────────────────────────── */

  function draw(time) {
    if (!bitmap) return;
    // ctx is already scaled by dpr, so draw in CSS pixels.
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const sh = bitmap.height / slices;
    const dh = h / slices;

    ctx.clearRect(0, 0, w, h);

    const amp = state.amp;
    const t = time;
    for (let i = 0; i < slices; i++) {
      const wobble = Math.sin(t * 0.7 + i * 0.31) * 2 + Math.sin(t * 2.3 + i * 1.7);
      const dx = (wobble + burst[i]) * amp;
      ctx.drawImage(
        bitmap,
        0, i * sh, bitmap.width, sh,
        dx, i * dh, w, dh + 0.5,
      );
    }
  }

  const drawStatic = () => { state.amp = 0; draw(0); canvas.classList.add('is-live'); };

  /* ── lifecycle ────────────────────────────────────────────────── */

  function start() {
    if (running || reduced() || saveData) return;
    running = true;
    tickerFn = () => draw(gsap.ticker.time);
    gsap.ticker.add(tickerFn);
  }

  function stop() {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tickerFn);
  }

  buildBitmap().then(() => {
    canvas.classList.add('is-live');

    if (reduced() || saveData) { drawStatic(); return; }

    // assemble out of noise on load
    gsap.fromTo(state, { amp: 120 }, {
      amp: 0,
      duration: 1.2,
      ease: 'expo.out',
      onStart: start,
    });

    // occasional choreographed glitch bursts
    idleTl = gsap.timeline({ repeat: -1, repeatRefresh: true, repeatDelay: gsap.utils.random(2.5, 6, true) });
    idleTl.call(() => {
      const n = Math.round(gsap.utils.random(4, 8));
      for (let k = 0; k < n; k++) {
        burst[Math.floor(Math.random() * slices)] = gsap.utils.random(-6, 6);
      }
      gsap.delayedCall(0.09, () => burst.fill(0));
    });

    // desktop only: dissolve into slices as the hero scrolls away
    if (!isMobile() && ScrollTrigger) {
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: ({ progress }) => {
          state.amp = progress * 180;
          canvas.style.opacity = String(1 - progress);
        },
      });
    }

    // pause when off-screen or the tab is hidden
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  });

  /* ── reactions ────────────────────────────────────────────────── */

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildBitmap().then(() => { if (!running) drawStatic(); }); }, 180);
  }, { passive: true });

  // the dither is baked with the current --ink/--paper, so re-bake on theme flip
  window.addEventListener('themechange', () => {
    buildBitmap().then(() => { if (!running) drawStatic(); });
  });

  onMotionPrefChange((isReduced) => {
    if (isReduced) { stop(); idleTl?.pause(); drawStatic(); }
    else { idleTl?.play(); start(); }
  });
}
