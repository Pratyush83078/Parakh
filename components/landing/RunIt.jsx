'use client';
import GhostWord from '@/components/motion/GhostWord';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

const REPO_URL = 'https://gitlab.com/testing83078/parakh-ai';

export default function RunIt() {
  const codeRef = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const block = codeRef.current;
    const lines = block.querySelectorAll('.ln-cmd');
    lines.forEach((el) => { el.dataset.text = el.textContent; el.textContent = ''; });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: block, start: 'top 78%', once: true },
      onStart: () => block.classList.add('is-typing'),
      onComplete: () => block.classList.remove('is-typing'),
    });
    lines.forEach((el) => {
      const text = el.dataset.text;
      tl.to({ p: 0 }, {
        p: 1,
        duration: Math.max(0.45, text.length * 0.032),
        ease: 'none',
        onStart: () => el.classList.add('is-active'),
        onComplete: () => el.classList.remove('is-active'),
        onUpdate() {
          el.textContent = text.slice(0, Math.round(this.targets()[0].p * text.length));
        },
      });
    });
  }, { scope: codeRef });

  return (
    <section id="run" className="ln-section">
      <GhostWord word="Run" side="left" />
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
          <pre ref={codeRef} className="ln-code" aria-label="Setup commands"><code>
            <span className="ln-cmd">pip install -r requirements.txt</span>{'\n'}
            <span className="ln-cmd">python src/run_all.py</span>{'\n'}
            <span className="ln-cmd">npm install && npm run dev</span>
          </code></pre>
        </Reveal>
      </div>
    </section>
  );
}
