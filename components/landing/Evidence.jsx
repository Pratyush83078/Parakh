'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import CoinFlipScale from '@/components/story/CoinFlipScale';
import { monthLabel } from '@/lib/monthLabel';

const nf = new Intl.NumberFormat('en-IN');

const TASKS = [
  { key: 'schedule_slipped_label', name: 'Schedule slip', what: 'the completion date move in the next report' },
  { key: 'cost_revised_up_label', name: 'Cost revision', what: 'the revised cost go up in the next report' },
];

function verdictFor(m) {
  const later = m.temporal_split[m.selected_model].roc_auc;
  const rule = m.temporal_split.rule_score_roc_auc;
  if (later < 0.55) return { tone: 'bad', text: `Not reliable yet. On a later month it scores ${later.toFixed(2)}, no better than a coin flip.` };
  if (later >= rule + 0.05) return { tone: 'good', text: `Preliminary ranking signal. ${later.toFixed(2)} across later-month tests, against ${rule.toFixed(2)} for the rule score alone.` };
  return { tone: 'mid', text: `Close to the rule score (${later.toFixed(2)} vs ${rule.toFixed(2)}). Not yet worth the complexity.` };
}

export default function Evidence({ metrics }) {
  const root = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    // Curtain: the dark room un-clips once as it enters (scroll-linked, then done).
    gsap.fromTo(root.current,
      { clipPath: 'inset(6% 2.5% 0% 2.5% round 2rem)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0rem)', ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 96%', end: 'top 35%', scrub: true },
      });
  }, { scope: root });

  const scaleRows = TASKS.map(({ key, name, what }) => {
    const m = metrics[key];
    const v = verdictFor(m);
    const rule = m.temporal_split.rule_score_roc_auc;
    const later = m.temporal_split[m.selected_model].roc_auc;
    return {
      key,
      name: `${name}: will ${what}?`,
      tone: v.tone,
      verdict: v.text,
      markers: [
        { kind: 'rule', label: 'Rules, same later month(s)', value: rule },
        { kind: 'held', label: `${m.selected_model.replaceAll('_', ' ')}, unseen-project mean`, value: m.group_split[m.selected_model].roc_auc },
        { kind: 'later', label: `Model, later-month mean (through ${monthLabel(m.temporal_split.test_month, 'short')})`, value: later },
      ],
    };
  });
  const slipM = metrics.schedule_slipped_label;
  const costM = metrics.cost_revised_up_label;

  return (
    <section id="evidence" ref={root} className="ln-section ln-evidence" data-word="Proof">
      
      <div className="ln-aurora ln-aurora-dark" aria-hidden="true" />
      <div className="ln-grain-dark" aria-hidden="true" />

      <div className="ln-wrap" style={{ position: 'relative', zIndex: 2 }}>
        <Reveal className="ln-section-head">
          <p className="ln-eyebrow"><span className="ln-idx">05</span> The evidence</p>
        </Reveal>
        <SplitWords as="h2" className="ln-display ln-h2" text="Does machine learning beat the simple rules?" accent={['beat']} />
        <Reveal delay={0.15}>
          <p className="ln-body ln-narrow" style={{ marginTop: '1.4rem' }}>
            We trained the selected model on {metrics.months.length} reports ({monthLabel(metrics.months[0], 'short')} to{' '}
            {monthLabel(metrics.months.at(-1), 'short')}) and tested it two ways: on projects the model never saw —
            and on up to three later months, with each test month trained only on earlier reports. These ordered tests
            better match real use. Rare cost increases leave only one recent month with enough events to evaluate.
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
                    <th scope="col" className="is-num">Rules, ordered mean</th>
                    <th scope="col" className="is-num">LogReg, unseen projects</th>
                    <th scope="col" className="is-num">GBoost, unseen projects</th>
                    <th scope="col" className="is-num">Selected model, ordered mean</th>
                    <th scope="col" className="is-num">PR-AUC / prevalence</th>
                    <th scope="col" className="is-num">Labeled events</th>
                  </tr>
                </thead>
                <tbody>
                  {TASKS.map(({ key, name }) => {
                    const m = metrics[key];
                    return (
                      <tr key={key}>
                        <td>{name}</td>
                        <td className="is-num ln-num">{m.temporal_split.rule_score_roc_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.group_split.logistic_regression.roc_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.group_split.gradient_boosting.roc_auc.toFixed(2)}</td>
                        <td className="is-num ln-num">{m.temporal_split[m.selected_model].roc_auc.toFixed(2)} · {m.selected_model.replaceAll('_', ' ')}</td>
                        <td className="is-num ln-num">{m.temporal_split[m.selected_model].pr_auc.toFixed(2)} / {m.temporal_split[m.selected_model].positive_rate.toFixed(2)}</td>
                        <td className="is-num ln-num">{nf.format(m.group_split.n_positive_labels)} total</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="ln-small" style={{ marginTop: '1rem' }}>
              Five group-held-out splits report mean ROC-AUC; project groups never cross each split. Ordered metrics average the available later months; compare PR-AUC with the event prevalence beside it. Horizon: the {metrics.horizon}.
              Generated by <code>src/model_train.py</code> into <code>data/processed/model_metrics.json</code>.
            </p>
          </details>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="ln-takeaway ln-narrow">
            The honest pitch: the rule score describes <em>today</em>, the slip model adds a preliminary ranking signal,
            and the cost model needs more history — cost revisions are rare: {costM.group_split.n_test_positives} in
            a test set of {nf.format(costM.group_split.n_test_rows)} project-months.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
