/**
 * Everything scroll-coupled. GSAP only — see CLAUDE.md: Anime.js is not
 * allowed anywhere in this file.
 */

const SECTIONS = ['work', 'about', 'resume', 'writing', 'contact'];

export function initScroll({ gsap, ScrollTrigger, SplitText }) {
  const navLinks = gsap.utils.toArray('[data-nav-link]');

  markCurrentSection(gsap, ScrollTrigger, navLinks);
  smoothAnchors(gsap);

  // Everything below is decoration. Under `reduce` the matchMedia block never
  // runs, so [data-reveal] must not be left at opacity 0 — components.css only
  // hides it inside a (prefers-reduced-motion: no-preference) query.
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tl = heroIntro(gsap, SplitText);
    const reveals = sectionReveals(gsap, ScrollTrigger);
    const nav = autoHideNav(gsap, ScrollTrigger);

    return () => {
      tl?.revert?.();
      reveals.forEach((r) => r.revert?.());
      nav?.kill?.();
    };
  });

  return mm;
}

/* ── hero intro ─────────────────────────────────────────────────── */

function heroIntro(gsap, SplitText) {
  const title = document.querySelector('[data-hero-title]');
  if (!title || !SplitText) return null;

  // autoSplit re-splits on resize and on font load, which is exactly what a
  // clamp()-sized headline needs. The returned instance must be reverted by
  // the matchMedia cleanup.
  const split = SplitText.create(title, {
    type: 'lines,chars',
    linesClass: 'line',
    autoSplit: true,
    mask: 'lines',
    onSplit(self) {
      return gsap.from(self.chars, {
        yPercent: 110,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.02,
      });
    },
  });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('[data-frame]', { clipPath: 'inset(4% round 20px)', duration: 0.5 }, 0)
    .from('.hero__lede', { y: 16, opacity: 0, duration: 0.6 }, 0.35)
    .from('.hero__actions > *', { y: 12, opacity: 0, duration: 0.4, stagger: 0.08 }, 0.45)
    .from('.nav > *', { y: -10, opacity: 0, duration: 0.4, stagger: 0.06 }, 0.2);

  return { revert: () => { split.revert(); tl.revert(); } };
}

/* ── reveals ────────────────────────────────────────────────────── */

function sectionReveals(gsap, ScrollTrigger) {
  const items = gsap.utils.toArray('[data-reveal]');
  if (!items.length) return [];

  const triggers = ScrollTrigger.batch(items, {
    start: 'top 85%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.06,
        overwrite: true,
      }),
  });

  gsap.set(items, { y: 24 });
  return triggers;
}

/* ── nav ────────────────────────────────────────────────────────── */

function markCurrentSection(gsap, ScrollTrigger, navLinks) {
  const byHash = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));

  SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    const link = byHash.get(id);
    if (!el || !link) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: ({ isActive }) => {
        link.classList.toggle('is-current', isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      },
    });
  });
}

function autoHideNav(gsap, ScrollTrigger) {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return null;

  const to = gsap.quickTo(nav, 'yPercent', { duration: 0.25, ease: 'power3.out' });

  return ScrollTrigger.create({
    start: 'top -120',
    end: 'max',
    onUpdate: ({ direction }) => {
      // never hide it while a dialog is open — it holds the only visible close
      if (document.querySelector('dialog[open]')) return to(0);
      to(direction === 1 ? -100 : 0);
    },
    onLeaveBack: () => to(0),
  });
}

/* ── anchors ────────────────────────────────────────────────────── */

function smoothAnchors(gsap) {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : document.body;
      if (!target) return;
      e.preventDefault();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        target.scrollIntoView();
      } else {
        gsap.to(window, {
          duration: 0.8,
          ease: 'power3.inOut',
          // No autoKill: it cancels the tween the moment it thinks the user
          // scrolled, and the nav's own ScrollTrigger updates look exactly
          // like that. Verified: with autoKill the click never scrolls.
          scrollTo: { y: target, offsetY: 72 },
        });
      }
      history.replaceState(null, '', id ? `#${id}` : location.pathname);
    });
  });
}
