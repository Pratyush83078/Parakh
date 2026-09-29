'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { monthLabel } from '@/lib/monthLabel';

export default function Footer({ metrics }) {
  const wordRef = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    // Each letter of the wordmark rises out of its own mask on arrival.
    // Masks sit flush (no flex gap) so letter spacing stays typographically
    // correct — the old flex+gap layout wedged ~0.22em between every letter.
    gsap.from(wordRef.current.querySelectorAll('.ln-f-inner'), {
      yPercent: 112, rotate: 6, duration: 1.15, stagger: 0.05, ease: 'power4.out',
      scrollTrigger: { trigger: wordRef.current, start: 'top 94%', once: true },
    });
  }, { scope: wordRef });

  return (
    <footer className="ln-footer">
      <div className="ln-wrap">
        <p ref={wordRef} className="ln-footer-word" aria-label="Parakh">
          <span className="ln-f-mask"><span className="ln-f-inner ln-deva" lang="hi">परख</span></span>
          {' '}
          {'Parakh.'.split('').map((c, i) => (
            <span key={i} className="ln-f-mask" aria-hidden="true">
              <span className="ln-f-inner" style={{ '--i': i }}>{c}</span>
            </span>
          ))}
        </p>
        <div className="ln-footer-row">
          <span>Parakh · SIH 26103 · Early warning for central infrastructure</span>
          <span>Data: MoSPI PAIMANA Flash Reports, {monthLabel(metrics.months[0], 'short')} – {monthLabel(metrics.months.at(-1), 'short')}</span>
          <span><Link href="/about">About the build</Link></span>
        </div>
      </div>
    </footer>
  );
}
