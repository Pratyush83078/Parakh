'use client';

import Link from 'next/link';
import { monthLabel } from '@/lib/monthLabel';

// Footer matches the main-branch design exactly: one plain serif wordmark
// with the blue period, one mono meta row. Static on purpose — an entrance
// animation here once stranded the wordmark at opacity 0 (trigger missed),
// and a brand element must never depend on JS to be visible.
export default function Footer({ metrics }) {
  return (
    <footer className="ln-footer">
      <div className="ln-wrap">
        <p className="ln-footer-word" aria-label="Parakh">
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
