'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';

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

    const settle = () => {
      speed += (speedTarget - speed) * 0.07;
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

    const pause = () => gsap.to(tween, { timeScale: 0, duration: 0.5, overwrite: true });
    const resume = () => gsap.to(tween, { timeScale: speedTarget, duration: 0.5, overwrite: true });
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
    <div ref={root} className="ln-ticker" aria-label="Portfolio vital signs">
      <div ref={track} className="ln-ticker-track">{row('a')}{row('b')}</div>
    </div>
  );
}
