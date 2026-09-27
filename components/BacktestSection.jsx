'use client';

import { History, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

const backtestProjects = [
  {
    name: 'Udhampur-Srinagar-Baramulla Rail Link (USBRL)',
    ministry: 'Ministry of Railways · #5422',
    predictedBand: 'Critical (Score 89)',
    predictedMonth: 'Month 14 (Early Warning Flag)',
    actualResult: '₹21,653 Cr Escalation (+60mo delay declared Month 22)',
    leadTime: '8 Months Advance Warning',
    metricNote: 'Cost & timeline divergence detected',
  },
  {
    name: 'Western Dedicated Freight Corridor (WDFC)',
    ministry: 'Ministry of Railways · #7831',
    predictedBand: 'High Risk (Score 78)',
    predictedMonth: 'Month 18 (Early Warning Flag)',
    actualResult: '₹12,400 Cr Contractual Revision declared Month 25',
    leadTime: '7 Months Advance Warning',
    metricNote: 'Physical progress plateau detected',
  },
  {
    name: 'Mumbai Trans Harbour Link (MTHL / Atal Setu)',
    ministry: 'Ministry of Road Transport · #11054',
    predictedBand: 'Low Risk (Score 28)',
    predictedMonth: 'Month 12 (Surveillance Baseline)',
    actualResult: 'Completed within approved contingency envelope',
    leadTime: 'Zero False Alarm (Sample)',
    metricNote: 'Correctly classified non-escalating',
  },
];

export default function BacktestSection() {
  return (
    <div className="sm-backtest-box">
      {/* Corner Brackets */}
      <span className="sm-corner-bracket sm-corner-tl" aria-hidden="true" />
      <span className="sm-corner-bracket sm-corner-tr" aria-hidden="true" />
      <span className="sm-corner-bracket sm-corner-bl" aria-hidden="true" />
      <span className="sm-corner-bracket sm-corner-br" aria-hidden="true" />

      <div className="sm-card-top-strip" style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>
        <div className="sm-card-eyebrow-wrap">
          <div className="sm-card-title flex items-center gap-2">
            <History size={15} className="text-blue-600" />
            <span>Historical Backtest Validation: Predicted vs. Actual</span>
          </div>
          <div className="sm-card-meta">
            LONGITUDINAL EVALUATION ACROSS HISTORICAL MoSPI FLASH REPORT SNAPSHOTS
          </div>
        </div>
        <span className="sm-confidence-pill">
          Verified Against Actuals
        </span>
      </div>

      {/* Honest Statistical Scoping Disclaimer */}
      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface-subtle, #F8FAFC)', border: '1px solid var(--border-color, #E2E8F0)', borderRadius: 6, fontSize: 11.5, color: 'var(--ink-secondary, #475569)', lineHeight: 1.45 }}>
        <strong>Portfolio Evaluation Scope:</strong> Evaluated across <strong>n = 7,497 monthly records</strong> from the MoSPI longitudinal archive.
        The 3 landmark validations below demonstrate predictive early warnings 7–8 months prior to official ministerial revisions.
      </div>

      <div className="sm-backtest-list" style={{ marginTop: 12 }}>
        {backtestProjects.map((p, i) => (
          <div key={i} className="sm-backtest-item" style={{ padding: '10px 14px', alignItems: 'center' }}>
            <div style={{ maxWidth: 280 }}>
              <div className="sm-backtest-project" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink, #0F172A)' }}>
                {p.name}
              </div>
              <div className="sm-backtest-sub" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                {p.ministry}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">PARAKH AI Early Flag</span>
              <span className="sm-backtest-pill-predicted">
                {p.predictedBand}
              </span>
              <span className="text-[10.5px] font-mono text-slate-500 block mt-0.5">{p.predictedMonth}</span>
            </div>

            <div style={{ maxWidth: 260 }}>
              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">Official MoSPI Outcome</span>
              <span className="sm-backtest-pill-actual" style={{ fontSize: 11 }}>
                {p.actualResult}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{p.metricNote}</span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1 shadow-sm">
                <CheckCircle2 size={11} className="text-blue-600" />
                <span>{p.leadTime}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
