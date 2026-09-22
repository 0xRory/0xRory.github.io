/**
 * Module entry point.
 *
 * Load order matters: the GSAP UMD bundles are classic scripts, so they have
 * already run by the time this deferred module executes. window.gsap is safe
 * to read here.
 *
 * This module owns the page's only requestAnimationFrame, via gsap.ticker.
 * Nothing else may call requestAnimationFrame directly.
 */

import { initScroll } from './scroll.js';
import { initUI } from './ui.js';
import { initHeroScanlines } from './hero-scanlines.js';
import { initI18n } from './i18n.js';

const { gsap, ScrollTrigger, SplitText, Flip, ScrollToPlugin } = window;

if (!gsap) {
  // The page is fully readable without any of this; fail quietly and bail.
  console.warn('GSAP failed to load — running without motion.');
} else {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, ScrollToPlugin);

  // One extra frame of lag is cheaper than a jank spike on a slow device.
  gsap.ticker.lagSmoothing(500, 33);

  const boot = () => {
    document.documentElement.classList.add('js');
    // Runs first: swaps in a stored language choice before anything below
    // measures text (ScrollTrigger positions, SplitText line-splitting).
    initI18n();
    initUI({ gsap, Flip });
    initScroll({ gsap, ScrollTrigger, SplitText });
    initHeroScanlines({ gsap, ScrollTrigger });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // Fonts change line-breaking, which changes every ScrollTrigger start/end.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

// Footer year — trivial, and works whether or not GSAP loaded.
const yearEl = document.querySelector('[data-year]');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
