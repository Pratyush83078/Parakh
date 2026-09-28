'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

const REPO_URL = 'https://gitlab.com/testing83078/parakh-ai';

export default function RunIt() {
  return (
    <section id="run" className="ln-section">
      <div className="ln-wrap ln-run-grid">
        <div>
          <Reveal className="ln-section-head">
            <p className="ln-eyebrow"><span className="ln-idx">07</span> Run it yourself</p>
          </Reveal>
          <SplitWords as="h2" className="ln-display ln-h2" text="Open source, end to end." accent={['Open']} />
          <Reveal delay={0.15}>
            <p className="ln-body" style={{ marginTop: '1.4rem' }}>
              pdfplumber, pandas, scikit-learn and Next.js. No cloud services. Drop the monthly PDFs
              into <code>data/pdfs/</code> and three commands rebuild every number on this page.
            </p>
            <div className="ln-actions" style={{ marginTop: '1.8rem' }}>
              <MagneticButton>
                <Link href="/projects" className="ln-btn ln-btn-ink" data-cursor>Explore all projects <ArrowRight size={15} /></Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/benchmarks" className="ln-btn ln-btn-ghost" data-cursor>Ministry benchmarks</Link>
              </MagneticButton>
              <MagneticButton>
                <a href={REPO_URL} className="ln-btn ln-btn-ghost" target="_blank" rel="noreferrer" data-cursor>Source code <ArrowUpRight size={14} /></a>
              </MagneticButton>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <pre className="ln-code" aria-label="Setup commands"><code>
            <span className="ln-cmd">pip install -r requirements.txt</span>{'\n'}
            <span className="ln-cmd">python src/run_all.py</span>{'\n'}
            <span className="ln-cmd">npm install && npm run dev</span>
          </code></pre>
        </Reveal>
      </div>
    </section>
  );
}
