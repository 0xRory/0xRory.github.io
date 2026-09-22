/**
 * Discrete UI micro-interactions. Anime.js v4 owns this file; GSAP appears
 * only for Flip (the card -> dialog morph), which Anime.js has no equal for
 * once ScrollTrigger is already on the page.
 *
 * Anime.js has no global reduced-motion switch, so every animate() call here
 * is guarded by reduced() at call time.
 */

import { animate, stagger, utils, text, createAnimatable, spring, steps } from 'animejs';
import { reduced, hasFinePointer, onMotionPrefChange } from './motion-prefs.js';

export function initUI({ gsap, Flip }) {
  navScramble();
  cardCounters();
  workFilter();
  caseDialogs(gsap, Flip);
  themeToggle();
  customCursor();
}

/* ── nav hover scramble ─────────────────────────────────────────── */

function navScramble() {
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const original = link.textContent;
    link.addEventListener('pointerenter', () => {
      if (reduced()) return;
      animate(link, {
        text: text.scrambleText({
          text: original,
          chars: 'uppercase',
          from: 'left',
          revealRate: 90,
          settleDuration: 160,
        }),
        duration: 240,
      });
    });
  });
}

/* ── project index count-up ─────────────────────────────────────── */

function cardCounters() {
  const els = utils.$('[data-count-to]');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);

      const el = entry.target;
      const to = Number(el.dataset.countTo);
      if (reduced()) { el.textContent = `[${String(to).padStart(2, '0')}]`; return; }

      const state = { v: 0 };
      animate(state, {
        v: to,
        duration: 600,
        ease: steps(12),
        modifier: utils.round(0),
        onUpdate: () => {
          el.textContent = `[${String(state.v).padStart(2, '0')}]`;
        },
      });
    });
  }, { threshold: 0.4 });

  els.forEach((el) => io.observe(el));
}

/* ── work filter ────────────────────────────────────────────────── */

function workFilter() {
  const grid = document.querySelector('[data-work-grid]');
  const buttons = document.querySelectorAll('[data-filter-btn]');
  if (!grid || !buttons.length) return;

  const items = Array.from(grid.children);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const want = btn.dataset.filterBtn;
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));

      const show = items.filter((li) => want === 'all' || li.dataset.category === want);
      const hide = items.filter((li) => !show.includes(li));

      if (reduced()) {
        hide.forEach((li) => { li.hidden = true; });
        show.forEach((li) => { li.hidden = false; utils.set(li, { opacity: 1, scale: 1 }); });
        return;
      }

      if (hide.length) animate(hide, {
        opacity: 0,
        scale: 0.96,
        duration: 220,
        ease: 'outQuad',
        delay: stagger(20),
        onComplete: () => hide.forEach((li) => { li.hidden = true; }),
      });

      show.forEach((li) => { li.hidden = false; });
      if (show.length) animate(show, {
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 380,
        ease: 'outExpo',
        delay: stagger(35, { from: 'first' }),
      });
    });
  });
}

/* ── case dialogs (GSAP Flip) ───────────────────────────────────── */

function caseDialogs(gsap, Flip) {
  document.querySelectorAll('[data-case]').forEach((trigger) => {
    const dialog = document.getElementById(`case-${trigger.dataset.case}`);
    if (!dialog) return;

    trigger.addEventListener('click', () => {
      const media = trigger.querySelector('[data-flip-id]');
      const state = media && Flip && !reduced() ? Flip.getState(media) : null;

      // Videos carry data-src so the four project clips are never fetched
      // until a case is actually opened.
      dialog.querySelectorAll('video[data-src]').forEach((v) => {
        if (!v.src) v.src = v.dataset.src;
      });

      dialog.showModal();

      if (state) {
        Flip.from(state, { duration: 0.6, ease: 'power3.inOut', absolute: true, scale: true });
      }
      if (!reduced()) {
        animate(dialog.querySelector('.case__inner'), {
          opacity: [0, 1], y: [12, 0], duration: 420, ease: 'outExpo',
        });
      }
    });

    dialog.addEventListener('close', () => {
      dialog.querySelectorAll('video').forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
    });

    // click on the backdrop closes
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });
}

/* ── theme toggle ───────────────────────────────────────────────── */

function themeToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  let stored = null;
  try { stored = localStorage.getItem('theme'); } catch { /* private mode */ }
  if (stored === 'light' || stored === 'dark') root.dataset.theme = stored;

  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : prefersDark.matches);
  const sync = () => btn.setAttribute('aria-pressed', String(isDark()));
  sync();

  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';

    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch { /* ignore */ }
      sync();
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
    };

    if (reduced()) return apply();

    const wipe = document.createElement('div');
    Object.assign(wipe.style, {
      position: 'fixed', inset: '0', zIndex: 'var(--z-scrim)',
      background: 'var(--ink)', transformOrigin: 'top', pointerEvents: 'none',
    });
    document.body.append(wipe);

    animate(wipe, {
      scaleY: [0, 1],
      duration: 260,
      ease: 'inOutQuart',
      onComplete: () => {
        apply();
        animate(wipe, {
          scaleY: [1, 0],
          transformOrigin: 'bottom',
          duration: 260,
          ease: 'inOutQuart',
          onComplete: () => wipe.remove(),
        });
      },
    });
  });
}

/* ── custom cursor ──────────────────────────────────────────────── */

function customCursor() {
  const el = document.querySelector('[data-cursor]');
  if (!el) return;

  let mounted = false;
  let cursor = null;
  let move = null;

  const mount = () => {
    if (mounted || reduced() || !hasFinePointer()) return;
    mounted = true;

    cursor = createAnimatable(el, {
      x: spring({ stiffness: 120, damping: 14 }),
      y: spring({ stiffness: 120, damping: 14 }),
    });

    move = (e) => {
      cursor.x(e.clientX - 7);
      cursor.y(e.clientY - 7);
      el.classList.add('is-live');
    };
    window.addEventListener('pointermove', move, { passive: true });

    document.querySelectorAll('a, button, [role="button"]').forEach((t) => {
      t.addEventListener('pointerenter', () => el.classList.add('is-over'));
      t.addEventListener('pointerleave', () => el.classList.remove('is-over'));
    });
  };

  const unmount = () => {
    if (!mounted) return;
    mounted = false;
    window.removeEventListener('pointermove', move);
    cursor?.revert?.();
    el.classList.remove('is-live', 'is-over');
  };

  mount();
  onMotionPrefChange((isReduced) => (isReduced ? unmount() : mount()));
}
