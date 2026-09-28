'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

/**
 * Ghost mega-word — a huge outlined serif word drifting behind a section,
 * parallax-scrubbed so it floats slower than the content beside it.
 * Purely decorative: aria-hidden, non-interactive, disabled under
 * reduced-motion (stays put as a faint watermark).
 */
export default function GhostWord({ word, side = 'right', top = '5rem' }) {
  const ref = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(ref.current, { yPercent: 20 }, {
        yPercent: -20, ease: 'none',
        scrollTrigger: {
          trigger: ref.current.parentElement,
          start: 'top bottom', end: 'bottom top', scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => mm.revert();
  }, { scope: ref });

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`ln-ghost ${side === 'left' ? 'is-left' : ''}`}
      style={{ top }}
    >
      {word}
    </span>
  );
}
