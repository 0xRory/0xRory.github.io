import { CDP, httpJson, sleep } from './cdp.mjs';

const PORT = Number(process.env.CDP_PORT || 9333);
const URL_ = process.env.PAGE || 'http://localhost:8777/';
const W = Number(process.env.W || 1280);
const H = Number(process.env.H || 900);

const log = [];
const results = [];
const ok = (cond, msg) => { results.push(cond); log.push((cond ? 'PASS  ' : 'FAIL  ') + msg); };

const targets = await httpJson(PORT, '/json/list');
const page = targets.find((t) => t.type === 'page');
const cdp = await new CDP(page.webSocketDebuggerUrl).connect();

const consoleErrors = [];
const pageErrors = [];
cdp.on('Runtime.consoleAPICalled', (p) => {
  if (p.type === 'error' || p.type === 'warning') {
    consoleErrors.push(p.type + ': ' + p.args.map((a) => a.value ?? a.description ?? '').join(' '));
  }
});
cdp.on('Runtime.exceptionThrown', (p) => pageErrors.push(p.exceptionDetails.text + ' ' + (p.exceptionDetails.exception?.description || '')));
const failedRequests = [];
cdp.on('Network.loadingFailed', (p) => failedRequests.push(p.errorText));
const requests = [];
cdp.on('Network.requestWillBeSent', (p) => requests.push(p.request.url));

await cdp.send('Runtime.enable');
await cdp.send('Network.enable');
await cdp.send('Page.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });

await cdp.send('Page.navigate', { url: URL_ });
await sleep(3500);

const $ = async (expr) => cdp.eval(expr);

// ── boot ──────────────────────────────────────────────────────────
ok(await $('typeof window.gsap === "object" || typeof window.gsap === "function"'), 'GSAP loaded');
ok(await $('!!window.ScrollTrigger && !!window.SplitText && !!window.Flip && !!window.ScrollToPlugin'), 'all four GSAP plugins on window');
ok(await $('document.documentElement.classList.contains("js")'), 'boot ran');
ok(await $('!!document.querySelector(".hero__title .line") || !!document.querySelector(".hero__title")'), 'hero title present');

const cv = await $('(()=>{const c=document.querySelector("[data-hero-canvas]");return c?{w:c.width,h:c.height,live:c.classList.contains("is-live")}:null})()');
ok(cv && cv.w > 0 && cv.live, `hero canvas painted ${cv ? cv.w + 'x' + cv.h : 'MISSING'}`);

ok(/^20\d\d$/.test(await $('document.querySelector("[data-year]")?.textContent || ""')), 'footer year rendered');

// ── third-party requests ──────────────────────────────────────────
const third = requests.filter((u) => !u.startsWith(URL_.replace(/\/$/, '')) && !u.startsWith('data:') && !u.startsWith('blob:'));
ok(third.length === 0, `zero third-party requests (${third.length})` + (third.length ? ' -> ' + third.slice(0, 3).join(', ') : ''));

// ── videos are not eagerly fetched ────────────────────────────────
ok(!requests.some((u) => u.endsWith('.mp4')), 'no .mp4 fetched on load');
ok(await $('[...document.querySelectorAll("video")].every(v=>!v.getAttribute("src"))'), 'no video has an eager src');

// ── scroll + reveals ──────────────────────────────────────────────
// reveals fire on entering the viewport, so walk the section past all of them
const workBottom = await $('document.getElementById("work").offsetTop + document.getElementById("work").offsetHeight');
for (let y = 0; y <= workBottom; y += 500) { await $(`window.scrollTo(0, ${y})`); await sleep(120); }
await sleep(900);
const revealed = await $(`(()=>{const a=[...document.querySelectorAll("#work [data-reveal]")];
  return {n:a.length, shown:a.filter(e=>+getComputedStyle(e).opacity>0.9).length}})()`);
ok(revealed.n > 0 && revealed.shown === revealed.n, `work reveals fired ${revealed.shown}/${revealed.n}`);

const idx = await $('document.querySelector("[data-count-to]")?.textContent');
ok(/^\[\d\d\]$/.test(idx || ''), `card index counted up: ${idx}`);

// ── filter ────────────────────────────────────────────────────────
await $(`document.querySelector('[data-filter-btn="Website"]').click()`);
await sleep(900);
const filtered = await $(`(()=>{const a=[...document.querySelectorAll(".work__item")];
  return {shown:a.filter(li=>!li.hidden).length, ok:a.filter(li=>!li.hidden).every(li=>li.dataset.category==="Website")}})()`);
ok(filtered.shown === 2 && filtered.ok, `filter Website -> ${filtered.shown} items, categories ${filtered.ok ? 'match' : 'MISMATCH'}`);

await $(`document.querySelector('[data-filter-btn="all"]').click()`);
await sleep(900);
ok(await $('[...document.querySelectorAll(".work__item")].filter(li=>!li.hidden).length === 10'), 'filter all -> 10 items');

// ── dialog + Flip ─────────────────────────────────────────────────
await $(`document.querySelector('[data-case="csbs"]').click()`);
await sleep(1200);
ok(await $('document.getElementById("case-csbs").open'), 'case dialog opened');
ok(await $('!!document.querySelector("#case-csbs video")?.src'), 'dialog video src hydrated on open');
ok(!requests.some((u) => u.endsWith('.mp4')), 'preload="none" holds: still no mp4 bytes even with src set');
await $('document.getElementById("case-csbs").close()');
await sleep(600);
ok(await $('!document.getElementById("case-csbs").open'), 'case dialog closed');
ok(await $('!document.querySelector("#case-csbs video").getAttribute("src")'), 'dialog video src released on close');

// ── theme ─────────────────────────────────────────────────────────
const before = await $('document.documentElement.dataset.theme || "(system)"');
await $('document.querySelector("[data-theme-toggle]").click()');
await sleep(1400);
const after = await $('document.documentElement.dataset.theme || "(none)"');
ok(after !== before && after !== '(none)', `theme toggled ${before} -> ${after}`);
ok(await $('!!localStorage.getItem("theme")'), 'theme persisted to localStorage');

// ── anchor scroll + nav sync ──────────────────────────────────────
await $('window.scrollTo(0,0)'); await sleep(400);
await $(`document.querySelector('a[href="#resume"]').click()`);
await sleep(1800);
const y = await $('Math.round(window.scrollY)');
ok(y > 100, `anchor scrolled (scrollY=${y})`);
await sleep(700);
ok(await $(`document.querySelector('a[href="#resume"]').classList.contains("is-current")`), 'nav marks current section');

// ── i18n ──────────────────────────────────────────────────────────
ok(await $('document.documentElement.dataset.lang === "en"'), 'default language is en');
ok(await $(`document.querySelector('[data-nav-link]').textContent`) === 'Work', 'nav shows English by default');
ok(await $(`document.querySelector('.hero__title').textContent`).then((t) => t.includes('Full-Stack')), 'hero title stays an English wordmark');

await $(`document.querySelector('[data-lang-toggle]').click()`);
await sleep(600);
ok(await $('document.documentElement.dataset.lang === "zh"'), 'toggled to zh');
ok(await $('document.documentElement.lang === "zh-Hant-TW"'), '<html lang> updates on toggle');
ok(await $(`document.querySelector('[data-nav-link]').textContent`) === '作品', 'nav switched to Chinese');
ok(await $(`document.querySelector('.hero__title').textContent`).then((t) => t.includes('Full-Stack')), 'hero title unchanged after toggle (still English wordmark)');
ok(await $(`localStorage.getItem('lang')`) === 'zh', 'language choice persisted to localStorage');

// csbs is one of the six case studies whose only copy used to be Chinese —
// confirms the dictionary, not stale inline HTML, is what's showing.
await $(`document.querySelector('[data-case="csbs"]').click()`);
await sleep(700);
const csbsZh = await $(`document.querySelector('#case-csbs .case__spec').textContent`);
ok(csbsZh.includes('社區'), 'a legacy Chinese-only case study renders its zh translation');
await $('document.getElementById("case-csbs").close()');

await $(`document.querySelector('[data-lang-toggle]').click()`);
await sleep(600);
ok(await $('document.documentElement.dataset.lang === "en"'), 'toggled back to en');
await $(`document.querySelector('[data-case="csbs"]').click()`);
await sleep(700);
const csbsEn = await $(`document.querySelector('#case-csbs .case__spec').textContent`);
ok(csbsEn.includes('SBT DApp') && !csbsEn.includes('社區'), 'same case study renders its en translation after toggling back');
await $('document.getElementById("case-csbs").close()');

// ── layout ────────────────────────────────────────────────────────
const of_ = await $('({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth})');
ok(of_.s <= of_.c + 1, `no horizontal overflow (${of_.s} vs ${of_.c})`);

// ── errors ────────────────────────────────────────────────────────
ok(pageErrors.length === 0, `no uncaught exceptions (${pageErrors.length})`);
pageErrors.forEach((e) => log.push('      ! ' + e.slice(0, 160)));
ok(consoleErrors.length === 0, `no console errors/warnings (${consoleErrors.length})`);
consoleErrors.forEach((e) => log.push('      ! ' + e.slice(0, 160)));
ok(failedRequests.length === 0, `no failed requests (${failedRequests.length})`);
failedRequests.forEach((e) => log.push('      ! ' + e));

console.log(log.join('\n'));
console.log(`\n${results.filter(Boolean).length} passed, ${results.filter((r) => !r).length} failed`);
cdp.close();
process.exit(results.every(Boolean) ? 0 : 1);
