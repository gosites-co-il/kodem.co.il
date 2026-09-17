import { useEffect } from 'react';

/** Adds .is-visible to .reveal elements when they enter the viewport. */
export function RevealObserver() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!nodes.length) return;

    const show = (el: Element) => el.classList.add('is-visible');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(show);
      return;
    }

    // Progressive enhancement: only hide while observing
    document.documentElement.classList.add('motion-ready');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
    );

    nodes.forEach((n) => {
      const rect = n.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
      if (inView) show(n);
      else io.observe(n);
    });

    // Safety: never leave content permanently hidden
    const safety = window.setTimeout(() => nodes.forEach(show), 2500);

    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return null;
}
