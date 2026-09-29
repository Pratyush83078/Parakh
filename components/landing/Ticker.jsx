'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import metrics from '@/data/processed/model_metrics.json';

/**
 * Vital-signs marquee — real portfolio numbers, duplicated for a seamless loop.
 * GSAP-driven so scroll velocity feeds it: the strip surges and skews while
 * you scroll, then settles back to cruise. Pauses on hover.
 */
export default function Ticker({ kpis }) {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(() => {
    // kpis starts null (skeleton render returns no DOM), so re-run when it
    // lands and guard the refs — a throw here would unmount the whole page.
    if (prefersReducedMotion() || !track.current || !root.current) return;
    const el = track.current;
    const tween = gsap.to(el, { xPercent: -50, ease: 'none', duration: 38, repeat: -1 });

    let speed = 1;
    let speedTarget = 1;
    let skew = 0;
    let skewTarget = 0;
    let hovering = false;

    // One loop owns timeScale — a separate pause tween would be overwritten
    // by this ticker on the very next frame. Hover simply lerps speed to 0.
    const settle = () => {
      const target = hovering ? 0 : speedTarget;
      speed += (target - speed) * 0.07;
      skew += (skewTarget - skew) * 0.1;
      skewTarget *= 0.92; // decay back to level between scroll events
      tween.timeScale(speed);
      gsap.set(el, { skewX: skew });
    };
    gsap.ticker.add(settle);

    const st = ScrollTrigger.create({
      onUpdate(self) {
        const v = self.getVelocity();
        speedTarget = gsap.utils.clamp(1, 3.4, 1 + Math.abs(v) / 850);
        skewTarget = gsap.utils.clamp(-5, 5, v / -420);
      },
    });

    const pause = () => { hovering = true; };
    const resume = () => { hovering = false; };
    const node = root.current;
    node.addEventListener('mouseenter', pause);
    node.addEventListener('mouseleave', resume);

    return () => {
      gsap.ticker.remove(settle);
      st.kill();
      tween.kill();
      node.removeEventListener('mouseenter', pause);
      node.removeEventListener('mouseleave', resume);
    };
  }, { scope: root, dependencies: [kpis] });

  if (!kpis) return null;
  const nf = new Intl.NumberFormat('en-IN');
  const bands = kpis.risk_band_counts || {};
  const items = [
    <><b className="ln-num">{nf.format(kpis.total_projects)}</b> projects in the latest report</>,
    <><b className="ln-num">₹{((kpis.total_revised_cost_cr || 0) / 1e5).toFixed(2)} lakh crore</b> revised cost</>,
    <><b className="ln-num">{nf.format((bands.High || 0) + (bands.Critical || 0))}</b> high or critical risk</>,
    <><b className="ln-num">{nf.format(kpis.projects_left_since_first_report)}</b> projects left since the first recorded report</>,
    <>{metrics.schedule_slipped_label.selected_model.replaceAll('_', ' ')} slip model <b className="ln-num">{metrics.schedule_slipped_label.temporal_split[metrics.schedule_slipped_label.selected_model].roc_auc.toFixed(2)}</b> mean ROC-AUC on ordered months</>,
    <>Rule score <b className="ln-num">0&ndash;100</b>, open arithmetic</>,
  ];
  const row = (key) => (
    <div className="ln-ticker-item" key={key} aria-hidden={key === 'b'}>
      {items.map((it, i) => (
        <span key={i} className="ln-ticker-entry">
          {it} <span className="ln-dot" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
  return (
    <div ref={root} className="ln-ticker" aria-label="Portfolio vital signs">
      <div ref={track} className="ln-ticker-track">{row('a')}{row('b')}</div>
    </div>
  );
}
