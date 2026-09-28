'use client';

import { Reveal, SplitWords } from '@/components/motion/Reveal';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const BRIEF = [
  { item: 'Statistical and predictive models', status: 'built',       detail: 'Rule score, logistic regression, gradient boosting — all trained and exportable' },
  { item: 'Does ML beat conventional statistics?', status: 'measured', detail: 'Same test sets, both splits — shown in Evidence. Confidence intervals next' },
  { item: 'CUF fields vs added variables', status: 'planned',        detail: 'Ablation: raw report fields only vs + engineered features' },
  { item: 'Early-warning alerts', status: 'partial',                  detail: 'Rule-band watchlist today; alert on rising model risk between reports, next' },
  { item: 'Peer benchmarking', status: 'partial',                     detail: 'Ministry and state cohort in every project record; benchmarks page live' },
  { item: 'Cost-escalation drivers', status: 'partial',               detail: 'Main driver from rule weights; SHAP-based per-project reasons planned' },
  { item: 'Monitoring dashboard', status: 'built',                    detail: 'Generated portfolio and model evidence with limitations shown beside the scores' },
  { item: 'Assistant for officials', status: 'planned',               detail: 'Open-weights model, answers cite project codes and PDF pages' },
  { item: 'Documentation and deployment', status: 'in-progress',     detail: 'One reproducible run_all.py; Dockerfile next' },
];

const LABEL = {
  built:       'Built',
  measured:    'Measured',
  partial:     'Partial',
  planned:     'Planned',
  'in-progress': 'In progress',
};

export default function Brief() {
  return (
    <section id="brief" className="ln-section">
      <div className="ln-wrap">
        <Reveal className="ln-section-head">
          <p className="ln-eyebrow"><span className="ln-idx">07</span> Against the brief</p>
        </Reveal>
        <SplitWords
          as="h2"
          className="ln-display ln-h2"
          text="What SIH 26103 asked for, and where we stand."
          accent={['SIH']}
        />
        <Reveal delay={0.1}>
          <p className="ln-body ln-narrow" style={{ marginTop: '1.4rem' }}>
            Every requirement from the problem statement, mapped to its current status.
            The goal is one honest answer per item — not a feature list, not a pitch.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="ln-brief" style={{ marginTop: '2.6rem' }}>
            {BRIEF.map(({ item, status, detail }) => (
              <li key={item}>
                <span className="ln-brief-item">{item}</span>
                <span className={`ln-status status-${status}`}>{LABEL[status]}</span>
                <span className="ln-brief-detail">{detail}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15}>
          <div style={{ marginTop: '2.6rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/about" className="ln-btn ln-btn-ghost">
              Full build notes <ArrowUpRight size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
