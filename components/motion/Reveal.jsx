'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

// Scroll-choreography primitives (GSAP + useGSAP, scoped + auto-cleanup).
//
// <Reveal>            — fades/translates its children up as they enter.
// <SplitWords as="h2"> — word-by-word masked rise for display headings.
//                        Keeps an unsplit accessible name via aria-label.

export function Reveal({ children, className = '', style, delay = 0, y = 30, stagger = 0.06, once = true }) {
  const ref = useRef(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const targets = ref.current.querySelectorAll(':scope > *');
      gsap.from(targets.length ? targets : ref.current, {
        y,
        opacity: 0,
        duration: 1,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 90%', once },
      });
    });
    return () => media.revert();
  }, { scope: ref });

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

export function SplitWords({ as: Tag = 'h2', text, className = '', accent = [], accentClass = 'ln-accent' }) {
  const ref = useRef(null);
  const words = text.split(' ');

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(ref.current.querySelectorAll('.ln-w-inner'), {
        yPercent: 115,
        rotate: 2.5,
        duration: 1.1,
        stagger: 0.045,
        ease: 'power4.out',
        scrollTrigger: { trigger: ref.current, start: 'top 92%', once: true },
      });
    });
    return () => media.revert();
  }, { scope: ref });

  return (
    <Tag ref={ref} className={`${className} ln-split`} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="ln-w-mask" aria-hidden="true">
          {/* The word break lives INSIDE the inner span as a no-break space:
              a plain trailing space inside an overflow-hidden inline-block is
              collapsed by line layout, which jammed headings together. */}
          <span className={`ln-w-inner ${accent.includes(w.replace(/[.,;—]/g, '')) ? accentClass : ''}`}>
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}
