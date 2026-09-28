'use client';

import { useRef } from 'react';
import { FileText, Table2, Calculator, LineChart } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Reveal, SplitWords } from '@/components/motion/Reveal';

const nf = new Intl.NumberFormat('en-IN');

const PIPELINE = [
  { icon: FileText, title: 'Read the PDF', body: 'Pull every project row out of each monthly Flash Report with coordinate extraction.', file: 'src/pdf_extracter.py' },
  { icon: Table2, title: 'Clean and join months', body: 'Fix glued cells, recover project codes, reconcile totals against MoSPI.', file: 'src/data_loader.py' },
  { icon: Calculator, title: 'Score and label', body: 'Open rule score for today; label what actually changed in the next report.', file: 'src/features.py · labels.py' },
  { icon: LineChart, title: 'Train and publish', body: 'Compare models against the rule score, export the snapshot this site reads.', file: 'src/model_train.py' },
];

// The rule score, exactly as src/features.py computes it.
const WEIGHTS = [
  { label: 'Cost overrun', w: 30, note: '0–50% above approved cost' },
  { label: 'Schedule slip', w: 25, note: '0–36 months late' },
  { label: 'Progress behind plan', w: 20, note: '0–40 points behind linear plan' },
  { label: 'Spend ahead of progress', w: 15, note: '0–40 points ahead' },
  { label: 'Revisions', w: 10, note: '0–3 cost or date revisions' },
];

export default function Method({ kpis, monthsCount }) {
  const weightsRef = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    // The bar fill lives in a ::after keyed to --fill, so tween the CSS var on the element.
    const bars = weightsRef.current.querySelectorAll('.ln-weight-bar');
    bars.forEach((bar, i) => {
      gsap.fromTo(bar, { '--fill': '0%' }, {
        '--fill': `${55 + i * 9}%`,
        duration: 1.1, delay: i * 0.1, ease: 'power4.out',
        scrollTrigger: { trigger: weightsRef.current, start: 'top 80%', once: true },
      });
    });
  }, { scope: weightsRef });

  return (
    <section id="method" className="ln-section">
      <div className="ln-wrap">
        <Reveal className="ln-section-head">
          <p className="ln-eyebrow"><span className="ln-idx">02</span> The method</p>
        </Reveal>
        <SplitWords as="h2" className="ln-display ln-h2" text="From PDF to early warning, in four steps." accent={['warning,']} />
        <Reveal delay={0.15}>
          <p className="ln-body ln-narrow" style={{ marginTop: '1.4rem' }}>
            One Python pipeline turns {monthsCount} monthly reports into
            {kpis?.panel_rows
              ? <> <b className="ln-num">{nf.format(kpis.panel_rows)}</b> project-months across <b className="ln-num">{nf.format(kpis.unique_projects_all_reports)}</b> projects</>
              : ' a project-by-month panel'}.
            The extract is reconciled against MoSPI&rsquo;s published totals for project count, cost and expenditure.
          </p>
        </Reveal>

        <Reveal className="ln-rise" delay={0.1} stagger={0.1}>
          <ol className="ln-pipeline" style={{ marginTop: '2.6rem' }}>
            {PIPELINE.map(({ icon: Icon, title, body, file }, i) => (
              <li key={title}>
                <span className="ln-step-num">STEP {String(i + 1).padStart(2, '0')}</span>
                <h3><Icon size={17} strokeWidth={1.7} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: '0.45em', color: 'var(--ln-blue)' }} />{title}</h3>
                <p>{body}</p>
                <code>{file}</code>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="ln-weights-block" ref={weightsRef}>
          <Reveal className="ln-rise">
            <div className="ln-narrow">
              <h3 className="ln-h3">The rule score is open arithmetic.</h3>
              <p className="ln-body">
                Five signals from the report, each capped and scaled from 0 to 1, then weighted into a score out of
                100. Anyone can check it by hand — the weights are our judgement, not learned from data. Which is
                exactly why we test it against the models below.
              </p>
            </div>
          </Reveal>
          <div className="ln-weights" role="img" aria-label={WEIGHTS.map((w) => `${w.label} weight ${w.w}`).join(', ')}>
            {WEIGHTS.map((w, i) => (
              <div key={w.label} style={{ flexGrow: w.w }} className="ln-weight">
                <span className="ln-weight-bar" style={{ '--fill': `${55 + i * 9}%` }} />
                <b className="ln-num">{w.w}</b>
                <span className="ln-weight-label">{w.label}</span>
                <span className="ln-weight-note">{w.note}</span>
              </div>
            ))}
          </div>
          <p className="ln-small">Bands: 0–25 Low · 25–50 Medium · 50–75 High · 75–100 Critical.</p>
        </div>
      </div>
    </section>
  );
}
