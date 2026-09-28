'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { monthLabel } from './Hero';

export default function Footer({ metrics }) {
  const wordRef = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(wordRef.current, {
      yPercent: 40, autoAlpha: 0, duration: 1.4, ease: 'power4.out',
      scrollTrigger: { trigger: wordRef.current, start: 'top 92%', once: true },
    });
  }, { scope: wordRef });

  return (
    <footer className="ln-footer">
      <div className="ln-wrap">
        <p ref={wordRef} className="ln-footer-word" aria-label="Parakh">
          <span className="ln-deva" lang="hi">परख</span> Parakh<span style={{ color: 'var(--ln-blue)' }}>.</span>
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
