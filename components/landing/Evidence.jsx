'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import AuroraField from '@/components/motion/AuroraField';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import CoinFlipScale from '@/components/story/CoinFlipScale';
import { monthLabel } from './Hero';

const nf = new Intl.NumberFormat('en-IN');

const TASKS = [
  { key: 'schedule_slipped_label', name: 'Schedule slip', what: 'the completion date move in the next report' },
  { key: 'cost_revised_up_label', name: 'Cost revision', what: 'the revised cost go up in the next report' },
];

function verdictFor(m) {
  const later = m.temporal_split.gradient_boosting.roc_auc;
  const rule = m.rule_score_roc_auc;
  if (later < 0.55) return { tone: 'bad', text: `Not reliable yet. On a later month it scores ${later.toFixed(2)}, no better than a coin flip.` };
  if (later >= rule + 0.05) return { tone: 'good', text: `Useful early warning. ${later.toFixed(2)} on a later month, against ${rule.toFixed(2)} for the rule score alone.` };
  return { tone: 'mid', text: `Close to the rule score (${later.toFixed(2)} vs ${rule.toFixed(2)}). Not yet worth the complexity.` };
}

export default function Evidence({ metrics }) {
  const root = useRef(null);
  const spot = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    // The dark room settles in like a card laid on the desk: slightly small
    // and rounded while entering, flush and square once you are inside it.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(root.current,
        { scale: 0.955, borderRadius: '2.5rem' },
        {
          scale: 1, borderRadius: '0rem', ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 96%', end: 'top 30%', scrub: true },
        });
    });
    // A quiet torch of blue light follows the pointer across the dark.
    mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
      gsap.set(spot.current, { xPercent: -50, yPercent: -50 });
      const xTo = gsap.quickTo(spot.current, 'x', { duration: 0.8, ease: 'power3.out' });
      const yTo = gsap.quickTo(spot.current, 'y', { duration: 0.8, ease: 'power3.out' });
      const move = (e) => {
        const r = root.current.getBoundingClientRect();
        xTo(e.clientX - r.left);
        yTo(e.clientY - r.top);
      };
      root.current.addEventListener('mousemove', move, { passive: true });
      return () => root.current.removeEventListener('mousemove', move);
    });
    return () => mm.revert();
  }, { scope: root });

  const scaleRows = TASKS.map(({ key, name, what }) => {
    const m = metrics[key];
    const v = verdictFor(m);
    return {
      key,
      name: `${name}: will ${what}?`,
      tone: v.tone,
      verdict: v.text,
      markers: [
        { kind: 'rule', label: 'Rule score alone', value: m.rule_score_roc_auc },
        { kind: 'held', label: 'Model, projects it never saw', value: m.group_split.gradient_boosting.roc_auc },
        { kind: 'later', label: `Model, a later month (${monthLabel(m.temporal_split.test_month, 'short')})`, value: m.temporal_split.gradient_boosting.roc_auc },
      ],
    };
  });
  const slipM = metrics.schedule_slipped_label;
  const costM = metrics.cost_revised_up_label;

  return (
    <section id="evidence" ref={root} className="ln-section ln-evidence">
      <div className="ln-aurora ln-aurora-dark" aria-hidden="true">
        <AuroraField palette="dark" />
      </div>
      <div ref={spot} className="ln-spot" aria-hidden="true" />
      <div className="ln-grain-dark" aria-hidden="true" />

      <div className="ln-wrap" style={{ position: 'relative', zIndex: 2 }}>
        <Reveal className="ln-section-head">
          <p className="ln-eyebrow"><span className="ln-idx">05</span> The evidence</p>
        </Reveal>
        <SplitWords as="h2" className="ln-display ln-h2" text="Does machine learning beat the simple rules?" accent={['beat']} />
        <Reveal delay={0.15}>
          <p className="ln-body ln-narrow" style={{ marginTop: '1.4rem' }}>
            We trained gradient boosting on {metrics.months.length} reports ({monthLabel(metrics.months[0], 'short')} to{' '}
            {monthLabel(metrics.months.at(-1), 'short')}) and tested it two ways: on projects the model never saw —
            and, the harder test, trained on earlier months and asked to predict a later one. That second test is
            the one that matches real use.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ marginTop: '2.4rem' }}>
            <CoinFlipScale rows={scaleRows} />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <details className="ln-details">
            <summary data-cursor>All numbers, including logistic regression and precision-recall</summary>
            <div className="ln-table-wrap">
              <table className="ln-table">
                <thead>
                  <tr>
                    <th scope="col">Prediction</th>
                    <th scope="col" className="is-num">Rule score</th>
                    <th scope="col" className="is-num">LogReg, held-out</th>
                    <th scope="col" className="is-num">GBoost, held-out</th>
                    <th scope="col" className="is-num">GBoost, later month</th>
                    <th scope="col" className="is-num">PR-AUC, later month</th>
                    <th scope="col" className="is-num">Test positives</th>
                  </tr>
                </thead>
                <tbody>
                  {TASKS.map(({ key, name }) => {
                    const m = metrics[key];
                    return (
                      <tr key={key}>
                        <td>{name}</td>
                        <td className="is-num ln-num">{m.rule_score_roc_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.group_split.logistic_regression.roc_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.group_split.gradient_boosting.roc_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.temporal_split.gradient_boosting.roc_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.temporal_split.gradient_boosting.pr_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.group_split.n_test_positives} of {nf.format(m.group_split.n_test_rows)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="ln-small" style={{ marginTop: '1rem' }}>
              Held-out test: {slipM.group_split.n_test_projects} projects kept out of training. Horizon: the {metrics.horizon}.
              Generated by <code>src/model_train.py</code> into <code>data/processed/model_metrics.json</code>.
            </p>
          </details>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="ln-takeaway ln-narrow">
            The honest pitch: the rule score describes <em>today</em>, the slip model adds a real early warning,
            and the cost model needs more history — cost revisions are rare: {costM.group_split.n_test_positives} in
            a test set of {nf.format(costM.group_split.n_test_rows)} project-months.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
