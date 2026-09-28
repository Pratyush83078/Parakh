'use client';

import { Reveal, SplitWords } from '@/components/motion/Reveal';

const nf = new Intl.NumberFormat('en-IN');

export default function Limits({ kpis, metrics }) {
  const items = [
    { dt: `${metrics.months.length} recorded report months`, dd: <>The current source set covers March 2025 through July 2026. New report layouts and rows marked for review still need source-page verification before use.</> },
    { dt: 'Projects that leave the list', dd: <>{kpis ? nf.format(kpis.projects_left_since_first_report) : 'Several hundred'} projects left the report after the first month. A project that finishes never gets a slip label, which biases the training data.</> },
    { dt: 'Scores rank, they do not promise', dd: <>Model scores are uncalibrated. Read a higher score as a higher ranking, not as an event frequency or a dependable probability.</> },
    { dt: 'A prompt for review, not a verdict', dd: <>Every flag is a reason for an official to look closer. The record shows the source numbers behind it, so the call stays with people.</> },
  ];

  return (
    <section id="limits" className="ln-section">
      <div className="ln-wrap">
        <Reveal className="ln-section-head">
          <p className="ln-eyebrow"><span className="ln-idx">06</span> The limits</p>
        </Reveal>
        <SplitWords as="h2" className="ln-display ln-h2" text="What this prototype cannot tell you yet." accent={['cannot']} />
        <Reveal className="ln-rise" delay={0.15} stagger={0.08}>
          <dl className="ln-limits" style={{ marginTop: '2.6rem' }}>
            {items.map(({ dt, dd }) => (
              <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
