'use client';

import { Reveal, SplitWords } from '@/components/motion/Reveal';

const nf = new Intl.NumberFormat('en-IN');

export default function Limits({ kpis, metrics }) {
  const items = [
    { dt: 'Four months of history', dd: <>Everything is learned from {metrics.months.length} reports. Older PAIMANA reports are the biggest single improvement available, and the pipeline takes them as they are.</> },
    { dt: 'Projects that leave the list', dd: <>{kpis ? nf.format(kpis.projects_left_since_first_report) : 'Several hundred'} projects left the report after the first month. A project that finishes never gets a slip label, which biases the training data.</> },
    { dt: 'Scores rank, they do not promise', dd: <>Model percentages are not calibrated yet. Read 40% as &ldquo;higher than most&rdquo;, not as a 40-in-100 frequency. Calibration is next.</> },
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
