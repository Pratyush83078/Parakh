'use client';

import { useRef } from 'react';
import CountUp from '@/components/motion/CountUp';
import { Reveal, SplitWords } from '@/components/motion/Reveal';
import { monthLabel } from '@/lib/monthLabel';

const nf = new Intl.NumberFormat('en-IN');

// Compact, scrollable history strip: full-height bars in a horizontal
// scroller so adding more report months never grows the section. Bars are
// static — a scroll-triggered grow-in once stranded them at scaleY(0).
export default function Problem({ kpis, months }) {
  const scrollerRef = useRef(null);
  const perMonth = Object.entries(kpis?.projects_per_month || {});
  const vals = perMonth.map(([, n]) => n);
  const minValue = vals.length ? Math.min(...vals) : 0;
  const maxValue = vals.length ? Math.max(...vals) : 0;
  const barHeight = (n) => maxValue === minValue ? 44 : 20 + ((n - minValue) / (maxValue - minValue)) * 44;

  return (
    <section id="problem" className="ln-section" data-word="After">
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

        <figure className="ln-months" aria-label="Projects listed in each monthly report">
          <div className="ln-months-scroller" ref={scrollerRef} tabIndex={0} aria-label="Scroll through report months">
            <div className="ln-months-grid">
              {perMonth.length === 0
                ? (months || []).map((m) => (
                    <div key={m} className="ln-month"><span className="ln-skel" style={{ width: '60%' }} /><span>{monthLabel(m, 'short')}</span></div>
                  ))
                : perMonth.map(([m, n]) => (
                    <div key={m} className="ln-month">
                      <b className="ln-num"><CountUp value={n} /></b>
                      <span className="ln-month-bar" aria-hidden="true" style={{ height: `${barHeight(n)}px` }} />
                      <span>{monthLabel(m, 'short')}</span>
                    </div>
                  ))}
            </div>
          </div>
          <figcaption>
            Projects per monthly report — scroll for more.
            {kpis?.projects_left_since_first_report != null && (
              <> <b className="ln-num">{nf.format(kpis.projects_left_since_first_report)}</b> projects have left the report since the first month.</>
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
