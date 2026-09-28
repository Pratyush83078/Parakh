'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import { monthLabel } from './Hero';

const nf = new Intl.NumberFormat('en-IN');

export default function Problem({ kpis, months }) {
  const barsRef = useRef(null);
  const perMonth = Object.entries(kpis?.projects_per_month || {});
  const perMonthMax = Math.max(1, ...perMonth.map(([, n]) => n));

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(barsRef.current.querySelectorAll('.ln-month-bar'), {
      scaleY: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out',
      scrollTrigger: { trigger: barsRef.current, start: 'top 78%', once: true },
    });
    gsap.from(barsRef.current.querySelectorAll('.ln-month b'), {
      autoAlpha: 0, y: 10, duration: 0.7, stagger: 0.12, delay: 0.35,
      scrollTrigger: { trigger: barsRef.current, start: 'top 78%', once: true },
    });
  }, { scope: barsRef });

  return (
    <section id="problem" className="ln-section">
      <div className="ln-wrap ln-split-2">
        <div>
          <Reveal className="ln-section-head">
            <p className="ln-eyebrow"><span className="ln-idx">01</span> The problem</p>
          </Reveal>
          <SplitWords as="h2" className="ln-display ln-h2" text="The Flash Report tells you after the fact." accent={['after']} />
          <Reveal className="ln-rise" delay={0.15}>
            <p className="ln-body" style={{ marginTop: '1.4rem' }}>
              A cost revision or a pushed completion date appears only once it is already printed. By then the
              monitoring team is reacting, not preventing. SIH 26103 asks for a tool that warns earlier, explains
              why, and tests honestly whether machine learning beats simple statistics.
            </p>
            <p className="ln-body">
              And the list itself shrinks every month — projects finish or drop out. History is literally
              disappearing from the page.
            </p>
          </Reveal>
        </div>

        <figure ref={barsRef} className="ln-months" aria-label="Projects listed in each monthly report">
          <div className="ln-months-grid">
            {perMonth.length === 0
              ? (months || []).map((m) => (
                  <div key={m} className="ln-month"><span className="ln-skel" style={{ width: '60%' }} /><span>{monthLabel(m, 'short')}</span></div>
                ))
              : perMonth.map(([m, n]) => (
                  <div key={m} className="ln-month">
                    <b className="ln-num">{nf.format(n)}</b>
                    <span className="ln-month-bar" style={{ height: `${(n / perMonthMax) * 100}%` }} />
                    <span>{monthLabel(m, 'short')}</span>
                  </div>
                ))}
          </div>
          <figcaption>
            Projects per monthly report.
            {kpis?.projects_left_since_first_report != null && (
              <> <b className="ln-num">{nf.format(kpis.projects_left_since_first_report)}</b> projects have left the report since the first month.</>
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
