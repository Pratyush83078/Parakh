'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function WhatIfSimulator({ project }) {
  const progressBase = project.physical_progress_pct ?? 0;
  const cost = project.revised_cost_cr ?? project.original_cost_cr ?? 0;
  const spendBase = cost > 0 ? Math.round((project.cumulative_expenditure_cr ?? 0) / cost * 100) : 0;
  const delayBase = project.doc_slip_months_so_far ?? 0;
  const baseline = project.risk_score ?? 0;
  const [progress, setProgress] = useState(progressBase);
  const [spend, setSpend] = useState(spendBase);
  const [delay, setDelay] = useState(delayBase);
  const gapDelta = Math.max(0, spend - progress) - Math.max(0, spendBase - progressBase);
  // Illustrative sensitivity only; deliberately not labelled as the pipeline rule score.
  const score = Math.min(100, Math.max(0, baseline + gapDelta * 0.45 + (delay - delayBase) * 0.75));
  return (
    <details className="sensitivity-tool">
      <summary>Explore an illustrative what-if</summary>
      <p>This simple sensitivity sketch changes the current score with spending/progress gaps and delay. It does not rerun the rules or ML models, and cannot predict the effect of an intervention.</p>
      <div className="sensitivity-controls">
        {[
          ['Physical progress', progress, setProgress, 0, Math.max(100, progressBase), '%'],
          ['Budget spent', spend, setSpend, 0, Math.max(180, spendBase), '%'],
          ['Schedule delay', delay, setDelay, Math.min(0, delayBase), Math.max(120, delayBase), ' months'],
        ].map(([label, value, set, min, max, unit]) => <label key={label}><span>{label}<output>{value}{unit}</output></span><input type="range" min={min} max={max} step="any" value={value} onChange={e => set(Number(e.target.value))} /></label>)}
      </div>
      <div className="sensitivity-result"><div><span>Illustrative score</span><output>{score.toFixed(1)}<small> / 100</small></output></div><button className="ln-btn ln-btn-ghost" onClick={() => { setProgress(progressBase); setSpend(spendBase); setDelay(delayBase); }}><RotateCcw size={14} /> Reset scenario</button></div>
      <p className="workspace-note">Sketch: baseline + 0.45 × change in spending/progress gap + 0.75 × change in delay months, bounded to 0–100. These weights are illustrative, not validated intervention effects.</p>
    </details>
  );
}
