'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import { monthLabel } from './Hero';

const nf = new Intl.NumberFormat('en-IN');
const BANDS = ['Low', 'Medium', 'High', 'Critical'];

export default function Portfolio({ kpis }) {
  const ref = useRef(null);
  const bands = kpis?.risk_band_counts || {};
  const bandTotal = BANDS.reduce((s, b) => s + (bands[b] || 0), 0);
  const highOrCritical = (bands.High || 0) + (bands.Critical || 0);
  const drivers = Object.entries(kpis?.primary_risk_drivers || {}).sort((a, b) => b[1] - a[1]);
  const driverMax = drivers[0]?.[1] || 1;

  useGSAP(() => {
    if (prefersReducedMotion() || !kpis) return;
    gsap.from(ref.current.querySelectorAll('.ln-bands-bar span'), {
      scaleX: 0, duration: 1.2, stagger: 0.08, ease: 'power4.inOut',
      scrollTrigger: { trigger: ref.current, start: 'top 75%', once: true },
    });
    gsap.from(ref.current.querySelectorAll('.ln-driver-track span'), {
      scaleX: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out',
      scrollTrigger: { trigger: ref.current.querySelector('.ln-drivers'), start: 'top 82%', once: true },
    });
  }, { scope: ref, dependencies: [kpis] });

  return (
    <section id="portfolio" className="ln-section" ref={ref}>
      <div className="ln-wrap">
        <Reveal className="ln-section-head">
          <p className="ln-eyebrow"><span className="ln-idx">03</span> The portfolio</p>
        </Reveal>
        <SplitWords as="h2" className="ln-display ln-h2" text={`Where ${nf.format(bandTotal) || 'the'} projects stand today.`} accent={['stand']} />
        <Reveal delay={0.15}>
          <p className="ln-body ln-narrow" style={{ marginTop: '1.4rem' }}>
            {kpis ? (
              <><b className="ln-num">{nf.format(highOrCritical)}</b> of {nf.format(bandTotal)} projects score High or
              Critical in the {monthLabel(kpis.report_month, 'short')} report. For most, the biggest single factor is
              slow physical progress.</>
            ) : 'Loading the latest snapshot.'}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <figure className="ln-bands" style={{ marginTop: '2.6rem' }}>
            <div className="ln-bands-bar" role="img" aria-label={BANDS.map((b) => `${b} ${bands[b] || 0}`).join(', ')}>
              {BANDS.map((b) => <span key={b} className={`band-bg-${b}`} style={{ flexGrow: bands[b] || 0 }} />)}
            </div>
            <ul className="ln-bands-legend">
              {BANDS.map((b) => (
                <li key={b}>
                  <span className={`ln-key-sq band-bg-${b}`} aria-hidden="true" />
                  <span>{b}</span>
                  <b className="ln-num">{kpis ? nf.format(bands[b] || 0) : '—'}</b>
                </li>
              ))}
            </ul>
          </figure>
        </Reveal>

        <Reveal className="ln-rise" delay={0.1}>
          <div className="ln-drivers">
            <h3 className="ln-h3" style={{ marginBottom: '1.3rem' }}>Main risk driver per project</h3>
            <ul>
              {drivers.map(([name, n]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span className="ln-driver-track"><span style={{ width: `${(n / driverMax) * 100}%` }} /></span>
                  <b className="ln-num">{nf.format(n)}</b>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
