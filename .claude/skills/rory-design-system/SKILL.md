---
name: rory-design-system
description: >
  The design system and motion contract for 0xrory.github.io — a monochrome
  terminal/pixel-art personal portfolio. Use whenever writing or reviewing CSS,
  HTML structure, or animation code in this repo: design tokens (--ink/--paper,
  fluid type, spacing, radius, z-index, motion), typography (Pixelify Sans +
  JetBrains Mono), section IDs and page architecture, the GSAP/Anime.js division
  of labour, the hero scanline canvas contract, and the reduced-motion rules.
  Triggers: design tokens, styling, CSS, colors, typography, animation, motion,
  hero, scanlines, scroll reveal, dark mode, theme toggle.
version: 1.0.0
metadata:
  scope: project
  companion: CLAUDE.md
---

# Rory design system

Monochrome terminal / brutalist-pixel. Off-white paper, black ink, no accent colour, blocky pixel display type against a wide-tracked monospace UI. Light is the default; dark is an **inversion of the same two tokens**, not a second theme.

**Photographic/media content is the one exception, approved by the site owner:** the hero/avatar portrait (`assets/images/avatar.*`), project card thumbnails (`.card__media img`), and case-study figures and videos (`.case__figure img`, `.case__body video`) all render in full, real colour — no grayscale filter, no dither. This is scoped to *photos and screenshots*, not UI chrome: type, tags, borders, backgrounds, icons and the frame stay strictly `--ink`/`--paper`. Don't add a hue to any of those without asking.

## Tokens — `assets/css/tokens.css`

Never hardcode these values in component CSS. If you need a value that has no token, add the token.

### Colour

```css
--paper: hsl(60 6% 95%);   --paper-sunk: hsl(60 5% 91%);
--ink:   hsl(0 0% 4%);
--ink-70: hsl(0 0% 4% / .70);  --ink-40: … / .40;
--ink-15: … / .15;             --ink-08: … / .08;
--hairline: 1px solid var(--ink);
--hairline-soft: 1px solid var(--ink-15);
```

Dark mode redefines `--paper` → `hsl(0 0% 5%)` and `--ink` → `hsl(60 6% 94%)` (plus the alpha derivatives) under **both** `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and `:root[data-theme="dark"]`. `body` always sets an explicit background.

### Type

```css
--ff-display: 'Pixelify Sans', 'Silkscreen', ui-monospace, monospace;
--ff-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
/* zh-Hant runs fall back to 'Noto Sans TC' — the mono faces have no CJK coverage */

--fs-display: clamp(3.25rem, 13vw, 11rem);
--fs-h1: clamp(2rem, 6.5vw, 4.5rem);
--fs-h2: clamp(1.5rem, 3.5vw, 2.5rem);
--fs-h3: clamp(1.125rem, 1.6vw, 1.5rem);
--fs-body: clamp(.875rem, .82rem + .22vw, 1rem);
--fs-sm: .8125rem;   --fs-xs: .6875rem;

--lh-display: .82;   --lh-tight: 1.05;   --lh-body: 1.65;
--tr-display: -.02em;  --tr-ui: .08em;   --tr-label: .16em;
```

Display face is used **only** for the hero headline and section numerals — it is uppercase-forward and has no CJK. Everything else is `--ff-mono`. Small labels and nav use `--fs-xs` + `--tr-label` + uppercase.

Fonts are self-hosted subsets in `assets/fonts/`. Display: `font-display: block` (a brief invisible hero beats a violent reflow from a 3×-narrower fallback). Mono: `font-display: swap` with `size-adjust`/`ascent-override` tuned against Menlo. Preload exactly these two files.

### Spacing, radius, z-index

```css
--sp-1 .25rem … --sp-48 12rem      /* 4px base: 1 2 3 4 6 8 12 16 24 32 48 */
--gutter: clamp(1rem, 4vw, 3.5rem);   --measure: 62ch;
--r-0 0; --r-sm 2px; --r-md 4px; --r-frame 20px; --r-full 999px;
--z-base 0; --z-hero-canvas 1; --z-sticky 10; --z-nav 100;
--z-cursor 900; --z-scrim 990; --z-dialog 1000;
```

`--r-frame` is the rounded outer viewport frame — it appears once, on the page shell.

### Motion

```css
--dur-instant 120ms; --dur-fast 220ms; --dur-base 400ms; --dur-slow 700ms; --dur-hero 1200ms;
--ease-out-expo: cubic-bezier(.16, 1, .3, 1);
--ease-in-out-q: cubic-bezier(.76, 0, .24, 1);
--ease-out-back: cubic-bezier(.34, 1.56, .64, 1);
--ease-step: steps(6, end);
```

JS equivalents: GSAP `"expo.out"`, `"power4.inOut"`, `"steps(8)"` · Anime.js `'outExpo'`, `'inOutQuart'`, `steps(8)`.

`--ease-step` / `steps()` is the on-brand easing — quantised motion reads as pixel/terminal. Use it for counters and reveals where it fits; keep `expo.out` for anything that should feel physical.

## Page architecture

A real scroll-driven single page. **There is no tab router** — the old `article[data-page]` switcher was deleted along with `script.js`.

| id | Contents |
|---|---|
| (fixed bar) | square mark top-left, right-aligned mono nav, theme toggle |
| `#hero` | `RORY` / `WEB3 ENGINEER` stacked display type, left half; scanline canvas right half; solid-ink `VIEW WORK` button + `> read writing` text link |
| `#work` | filter row (mono text links, not a `<select>`) + project grid — the page's centre of gravity |
| `#about` | bio + tech stack as mono text tags |
| `#resume` | AceMeta Lab / YILE TECHNOLOGY timeline |
| `#writing` | blog + ITHelp posts, one merged list |
| `#contact` | large mono email link + socials |
| `footer` | colophon, year |

Deep links (`#work`, `#about`, …) work via `scroll-margin-top` + `scroll-behavior: smooth`, with GSAP ScrollToPlugin enhancing nav clicks.

Naming: flat kebab-case with a block prefix (`hero__canvas-wrap`, `work__filter`, `card__index`). The old template's `.tip_*`, `.descprition`, `.curr`, `.info_*` and `data-selecct-value` are deleted — do not resurrect them.

## Library division of labour

| Domain | Library |
|---|---|
| Anything scroll-coupled (reveals, pin, scrub, nav sync, parallax) | **GSAP ScrollTrigger** |
| Multi-step choreography (hero intro) | **GSAP timeline** |
| Headline text splitting | **GSAP SplitText** with `autoSplit: true` (re-splits on resize; Anime.js `splitText` does not) |
| Card → dialog morph | **GSAP Flip** |
| The single rAF | **`gsap.ticker`** |
| Nav hover scramble | **Anime.js** `text.scrambleText()` (native in v4.5) |
| Project index count-up, filter re-stagger, stack tags | **Anime.js** `stagger({grid})` + `utils.round` |
| Custom cursor | **Anime.js** `createAnimatable()` + `createSpring()` |
| Theme wipe | **Anime.js** |
| Card hover, email underline, hairlines | **pure CSS** — do not attach JS listeners to 8 cards |

Hard rule: **nothing scroll-triggered and nothing in the canvas loop uses Anime.js.**

## Hero scanline canvas — the contract

`assets/js/hero-scanlines.js`. DOM contract, frozen:

```html
<div class="hero__canvas-wrap">
  <picture>
    <source srcset="./assets/images/avatar.avif" type="image/avif">
    <source srcset="./assets/images/avatar.webp" type="image/webp">
    <img class="hero__fallback" src="./assets/images/avatar.png" width="…" height="…" alt="Rory">
  </picture>
  <canvas class="hero__canvas" aria-hidden="true"></canvas>
</div>
```

The `<img>` sits at `--z-base` and is always present; the canvas is absolutely positioned at `--z-hero-canvas` and only gets `opacity: 1` **after a successful first paint**.

Technique: source image → `createImageBitmap()` (full colour, no grayscale/dither step — see the exception above) → cached as an `ImageBitmap`. Each frame, `drawImage` N horizontal slices with a per-slice x displacement. `ctx.imageSmoothingEnabled = true` with `imageSmoothingQuality: 'high'` (the old 1-bit path disabled smoothing to keep dither edges crisp; a real photo wants the opposite). DPR capped at 2.

```
N = mobile ? 24 : 48 ;  h = ceil(H / N)
dx = (sin(t*0.7 + i*0.31)*2 + sin(t*2.3 + i*1.7)*1 + burst[i]) * amp
```

- `amp` is a **GSAP-tweened scalar**, never per-frame `Math.random()`. Intro runs `amp: 120 → 0` over `--dur-hero` with `expo.out` so the portrait assembles.
- `burst[]` is filled by a repeating GSAP timeline (`repeatRefresh: true`, `repeatDelay: gsap.utils.random(2.5, 6)`) spiking 4–8 slices for 90 ms. Choreographed glitches read as intent; per-frame randomness reads as broken.
- Desktop scroll: ScrollTrigger `scrub: 0.6` maps hero exit to `amp: 0 → 180` + fade.
- `IntersectionObserver` + `visibilitychange` → `gsap.ticker.remove()` when not visible.

Degradation: `prefers-reduced-motion` or `saveData` → draw **one** static `amp = 0` frame and never register the ticker callback. `< 768px` → `N = 24`, logical width ≤ 900, no `difference` bursts, half `amp`, no scroll scrub.

## Reduced motion

`assets/js/motion-prefs.js` exports a live singleton backed by `matchMedia('(prefers-reduced-motion: reduce)')` with a `change` listener.

- GSAP: wrap everything in `gsap.matchMedia()` keyed on `"(prefers-reduced-motion: no-preference)"`, with cleanup functions that revert SplitText.
- Anime.js: **check the singleton at every call site.** There is no global disable.
- Under `reduce`: sections render at `opacity: 1` immediately, the cursor never mounts, the canvas draws one frame, CSS marquees get `animation-play-state: paused`.

## Accessibility

`<dialog>` + `showModal()` for project detail — native focus trap and Esc. Keep `:focus-visible` rings visible (a 2px `--ink` outline offset by 2px). The custom cursor is decorative: never the only affordance, and it does not mount under `@media (hover: none)`. Canvas is `aria-hidden`. SplitText output keeps the original text readable to screen readers.
