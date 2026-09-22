# 0xrory.github.io

Personal portfolio for Rory (`0xRory`) — full-stack engineer, Taichung TW, positioning toward Web3 / smart-contract security. Single page, monochrome terminal/pixel aesthetic.

Detailed design tokens, section IDs and the motion inventory live in `.claude/skills/rory-design-system/SKILL.md`. **Read it before touching CSS or animation code.**

## Hard constraints

**No build step. No `package.json`. Never run `npm install`.**
This is a GitHub Pages user site served from the repo root on `main`. Pushing to `main` deploys it. Anything that requires a compile step is out of scope — if you think you need one, stop and ask.

**Libraries are vendored, not fetched at runtime.**
`assets/js/vendor/` holds pinned copies of GSAP (UMD, `<script>` tags) and Anime.js v4 (ESM, via import map). The site makes **zero third-party requests** — no CDN, no Google Fonts, no icon service, no shields.io badges. Keep it that way. To update a library, download the new file into `vendor/` and change the version comment.

**jQuery, jquery.transit and the Bootstrap 3 carousel are gone. Never reintroduce them.**
Same for Ionicons — icons are inline `<use>` refs into `assets/icons/sprite.svg`.

**GSAP owns scroll and timelines. Anime.js owns discrete UI micro-interactions.**
Nothing scroll-triggered and nothing inside the canvas render loop may use Anime.js. Never bind both libraries to the same element or property — they will fight.

**One requestAnimationFrame for the whole page, owned by `gsap.ticker`.**
Do not call `requestAnimationFrame` directly. Register per-frame work with `gsap.ticker.add()` and remove it when off-screen.

**Every animation respects `prefers-reduced-motion`.**
GSAP work goes inside `gsap.matchMedia()`. Anime.js has no global switch, so check the singleton in `assets/js/motion-prefs.js` **at each call site** — `matchMedia` can change mid-session.

**Monochrome only.** Two colours: `--ink` and `--paper`, plus alpha derivatives. Introducing any hue needs explicit approval.

**Use the tokens.** No hardcoded colors, font sizes, spacing, radii, z-indexes or durations in component CSS. If a value you need has no token, add the token.

## Layout

```
index.html                 # the only page
assets/css/                # tokens.css, base.css, layout.css, components.css — 4 parallel <link>s, no @import
assets/js/                 # main.js (module entry) + scroll.js, ui.js, hero-scanlines.js, motion-prefs.js
assets/js/vendor/          # pinned GSAP + Anime.js
assets/fonts/              # self-hosted subset woff2
assets/icons/sprite.svg    # single inline SVG sprite
assets/images/             # AVIF/WebP with png/jpg fallback
assets/project1..8/        # per-project media
```

## Verifying a change

There is no test framework, but there is a headless smoke test — run it before
you call anything done:

```sh
./tools/check.sh
```

It drives a real Chrome over the DevTools Protocol at three configurations
(desktop, 390px, reduced-motion) and asserts the things that have actually
broken here: console output, third-party requests, eager video fetches, scroll
reveals, the work filter, the case dialog, the theme toggle, anchor scrolling
and horizontal overflow. Zero dependencies — `tools/cdp.mjs` is a ~90-line
WebSocket client over node's built-ins.

To look at it yourself:

```sh
python3 -m http.server 8000     # import maps and module scripts need http, not file://
```

Console must be **zero output** (not just zero errors — Anime.js deprecation
warnings count); Network must show **zero third-party requests**; walk the page
once with the OS "reduce motion" setting on; check 375 / 768 / 1440 px.

## Budgets

JS ≤ 105 KB gzip · CSS ≤ 12 KB gzip · fonts ≤ 45 KB · LCP < 1.2 s on 4G · CLS < 0.02 · INP < 100 ms · third-party requests = 0.

## Bilingual content (English / Traditional Chinese)

The site has a live EN/中 toggle — see `assets/js/i18n.js` for the mechanism and
`.claude/skills/rory-design-system/SKILL.md` for the full convention. In short:

- New user-facing copy needs **both** an English and a Traditional Chinese
  version added to the `DICT` object in `assets/js/i18n.js`, referenced from
  the HTML via `data-i18n="key"` (or `data-i18n-aria="key"` for an
  aria-label). English is the static/no-JS default; JS applies the stored or
  default language on load.
- Exception: `.hero__title` and every `.section__title` (the big pixel
  headlines) are never translated — `--ff-display` has no CJK glyphs, so
  those stay fixed English wordmarks in both languages, like a logotype.
- `<html lang>` updates with the toggle (`en` / `zh-Hant-TW`); it starts as
  `lang="en"` in the source. Any Chinese text embedded inside an
  English-default string (a proper noun, a quoted phrase) still needs its own
  `lang="zh-Hant-TW"` span, same as before this feature existed.

## Content notes

- Contact email is `0x1rory@gmail.com`. The old `richard@example.com` was template residue.
- Don't add testimonials, ratings or social proof that isn't real.
