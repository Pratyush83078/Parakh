'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal, SplitWords } from '@/components/motion/Reveal';

const REPO_URL = 'https://gitlab.com/testing83078/parakh-ai';

// Commands render as static text — the old GSAP typewriter blanked the
// lines first and typed on a scroll trigger that could miss (restored
// scrolls, refresh races), leaving the block visibly empty.
export default function RunIt() {
  return (
    <section id="run" className="ln-section" data-word="Run">
      <div className="ln-wrap ln-run-grid">
        <div>
          <Reveal className="ln-section-head">
            <p className="ln-eyebrow"><span className="ln-idx">08</span> Run it yourself</p>
          </Reveal>
          <SplitWords as="h2" className="ln-display ln-h2" text="Open source, end to end." accent={['Open']} />
          <Reveal delay={0.15}>
            <p className="ln-body" style={{ marginTop: '1.4rem' }}>
              pdfplumber, pandas, scikit-learn and Next.js. No cloud services. Drop the monthly PDFs
              into <code>data/pdfs/</code> and three commands rebuild every number on this page.
            </p>
            <div className="ln-actions" style={{ marginTop: '1.8rem' }}>
              <Link href="/projects" className="ln-btn ln-btn-ink">Explore all projects <ArrowRight size={15} /></Link>
              <Link href="/benchmarks" className="ln-btn ln-btn-ghost">Ministry benchmarks</Link>
              <a href={REPO_URL} className="ln-btn ln-btn-ghost" target="_blank" rel="noreferrer">Source code <ArrowUpRight size={14} /></a>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <pre className="ln-code" aria-label="Setup commands"><code>
            <span className="ln-cmd">pip install -r requirements.txt</span>{'\n'}
            <span className="ln-cmd">python src/run_all.py</span>{'\n'}
            <span className="ln-cmd">npm install &amp;&amp; npm run dev</span>
          </code></pre>
        </Reveal>
      </div>
    </section>
  );
}
