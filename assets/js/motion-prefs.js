/**
 * Reduced-motion singleton.
 *
 * GSAP has gsap.matchMedia(); Anime.js has no global switch at all, so every
 * Anime.js call site must ask this module. matchMedia can flip mid-session
 * (the user changes an OS setting), so read `reduced()` at call time — never
 * cache the boolean at boot.
 */

const query = window.matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new Set();

query.addEventListener('change', () => {
  for (const fn of listeners) {
    try { fn(query.matches); } catch (err) { console.error(err); }
  }
});

export const reduced = () => query.matches;

export function onMotionPrefChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Run `fn` only when motion is welcome; otherwise run `fallback` (optional). */
export function withMotion(fn, fallback) {
  if (reduced()) return fallback ? fallback() : undefined;
  return fn();
}

/** True when the device has a real pointer — gates the custom cursor. */
export const hasFinePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;
