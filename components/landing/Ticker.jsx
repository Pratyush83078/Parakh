'use client';

// Vital-signs marquee — real portfolio numbers, duplicated for a seamless loop.
export default function Ticker({ kpis }) {
  if (!kpis) return null;
  const nf = new Intl.NumberFormat('en-IN');
  const bands = kpis.risk_band_counts || {};
  const items = [
    <><b className="ln-num">{nf.format(kpis.total_projects)}</b> projects in the latest report</>,
    <><b className="ln-num">₹{((kpis.total_revised_cost_cr || 0) / 1e5).toFixed(2)} lakh crore</b> revised cost</>,
    <><b className="ln-num">{nf.format((bands.High || 0) + (bands.Critical || 0))}</b> high or critical risk</>,
    <><b className="ln-num">{nf.format(kpis.projects_left_since_first_report)}</b> projects left the list since April</>,
    <>Slip model <b className="ln-num">0.75</b> ROC-AUC on a later month</>,
    <>Rule score <b className="ln-num">0&ndash;100</b>, open arithmetic</>,
  ];
  const row = (key) => (
    <div className="ln-ticker-item" key={key} aria-hidden={key === 'b'}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '3.2rem' }}>
          {it} <span className="ln-dot">◆</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="ln-ticker" aria-label="Portfolio vital signs">
      <div className="ln-ticker-track">{row('a')}{row('b')}</div>
    </div>
  );
}
