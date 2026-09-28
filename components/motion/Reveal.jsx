'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';

// Scroll-choreography primitives (GSAP + useGSAP, scoped + auto-cleanup).
//
// <Reveal>            — fades/translates its children up as they enter.
// <SplitWords as="h2"> — word-by-word masked rise for display headings.
//                        Keeps an unsplit accessible name via aria-label.

export function Reveal({ children, className = '', delay = 0, y = 44, stagger = 0.08, once = true }) {
  const ref = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const targets = ref.current.querySelectorAll(':scope > *');
    gsap.from(targets.length ? targets : ref.current, {
      y,
      autoAlpha: 0,
      duration: 1,
      delay,
      stagger,
      ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 82%', once },
    });
  }, { scope: ref });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function SplitWords({ as: Tag = 'h2', text, className = '', accent = [], accentClass = 'ln-accent' }) {
  const ref = useRef(null);
  const words = text.split(' ');

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current.querySelectorAll('.ln-w-inner'), {
      yPercent: 115,
      rotate: 2.5,
      duration: 1.1,
      stagger: 0.045,
      ease: 'power4.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
    });
  }, { scope: ref });

  return (
    <Tag ref={ref} className={`${className} ln-split`} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="ln-w-mask" aria-hidden="true">
          <span className={`ln-w-inner ${accent.includes(w.replace(/[.,;—]/g, '')) ? accentClass : ''}`}>
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
