'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import MagneticButton from '@/components/motion/MagneticButton';
import { fmtCr, cleanState } from '@/lib/api';

const nf = new Intl.NumberFormat('en-IN');
export const lakh = (cr) => (cr == null ? '—' : (cr / 1e5).toFixed(2));
export const monthLabel = (ym, style = 'long') =>
  ym ? new Date(`${ym}-01T00:00:00`).toLocaleString('en-IN', { month: style, year: 'numeric' }) : '—';
const shortMinistry = (m) => (m || '').replace(/^(Ministry|Department) of /, '');

/* ── Proof card: one real flagged project, annotated ─────────────────────── */
export function HeroSlip({ projects, month, onInspect }) {
  const [i, setI] = useState(0);
  const cardRef = useRef(null);
  const p = projects[i];

  const next = () => {
    const go = () => setI((i + 1) % projects.length);
    if (prefersReducedMotion() || !cardRef.current) return go();
    gsap.to(cardRef.current, {
      y: 14, autoAlpha: 0, duration: 0.28, ease: 'power2.in',
      onComplete: () => {
        go();
        gsap.fromTo(cardRef.current, { y: -14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
      },
    });
  };

  if (!p) {
    return (
      <aside className="ln-slip" aria-busy="true" aria-label="Loading an example project">
        {[70, 90, 40, 100, 100, 60].map((w, k) => <span key={k} className="ln-skel" style={{ width: `${w}%`, margin: '0.55rem 0' }} />)}
      </aside>
    );
  }

  const delay = Math.max(0, p.doc_slip_months_so_far || 0);
  return (
    <aside ref={cardRef} className="ln-slip" aria-label="Example flagged project" aria-live="polite">
      <header className="ln-slip-head">
        <span>Flagged · {monthLabel(month, 'short')} report</span>
        <span className="ln-num">{i + 1} / {projects.length}</span>
      </header>
      <h2 className="ln-slip-title">{p.project_name}</h2>
      <p className="ln-slip-meta">
        <span className="ln-num">#{p.project_code}</span>
        <span>{shortMinistry(p.ministry)}</span>
        <span>{cleanState(p.state)}</span>
      </p>
      <dl className="ln-slip-rows">
        <div><dt>Cost, approved → revised</dt><dd className="ln-num">{fmtCr(p.original_cost_cr)} → {fmtCr(p.revised_cost_cr)}</dd></div>
        <div><dt>Completion date pushed</dt><dd className="ln-num">{delay > 0 ? `${delay} months` : 'Not yet'}</dd></div>
        <div><dt>Physical progress</dt><dd className="ln-num">{(p.physical_progress_pct ?? 0).toFixed(1)}%</dd></div>
      </dl>
      <div className="ln-slip-reads">
        <div>
          <span className="ln-read-label">Rule score · today</span>
          <span className="ln-read-value">{p.risk_score?.toFixed(1)}</span>
          <span className="ln-read-note">{p.risk_band} — mostly {(p.primary_risk_driver || '').toLowerCase()}</span>
        </div>
        <div>
          <span className="ln-read-label">Model · next report</span>
          <span className="ln-read-value">{p.schedule_slipped_risk_pct != null ? `${p.schedule_slipped_risk_pct.toFixed(0)}%` : '—'}</span>
          <span className="ln-read-note">chance the date moves</span>
        </div>
      </div>
      <footer className="ln-slip-foot">
        <button type="button" className="ln-btn ln-btn-ink" onClick={() => onInspect(p.project_code)} data-cursor>Open full record</button>
        <button type="button" className="ln-btn ln-btn-ghost" onClick={next} data-cursor>
          Next project <ChevronRight size={14} />
        </button>
      </footer>
    </aside>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
export default function Hero({ kpis, kErr, flagged, onInspect }) {
  const root = useRef(null);
  const month = kpis?.report_month;
  const overrunPct = kpis
    ? ((kpis.total_revised_cost_cr - kpis.total_original_cost_cr) / kpis.total_original_cost_cr) * 100
    : null;

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);

    // Intro timeline: eyebrow → headline lines → lead → facts → CTAs → card.
    const tl = gsap.timeline({ delay: 0.25 });
    tl.from(q('.ln-hero-eyebrow'), { y: 24, autoAlpha: 0, duration: 0.8 }, 0)
      .from(q('.ln-h1 .ln-w-inner'), { yPercent: 118, rotate: 3, duration: 1.25, stagger: 0.05, ease: 'power4.out' }, 0.1)
      .from(q('.ln-hero-lead'), { y: 30, autoAlpha: 0, duration: 0.9 }, 0.55)
      .from(q('.ln-hero-facts'), { y: 26, autoAlpha: 0, duration: 0.9 }, 0.7)
      .from(q('.ln-hero-actions > *'), { y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.09 }, 0.82)
      .from(q('.ln-slip'), { y: 60, autoAlpha: 0, rotate: 5, duration: 1.2, ease: 'power4.out' }, 0.65)
      .from(q('.ln-scroll-hint'), { autoAlpha: 0, duration: 0.8 }, 1.3);

    // Grain orbs drift at different depths on scroll.
    gsap.to(q('.ln-orb-blue'), {
      yPercent: 28, ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to(q('.ln-orb-saffron'), {
      yPercent: -18, ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
    });
    // Proof card gently straightens + lifts as you leave the hero.
    gsap.to(q('.ln-slip'), {
      rotate: 0, y: -40, ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
    });
  }, { scope: root });

  return (
    <section ref={root} className="ln-hero" id="top">
      <div className="ln-orbs" aria-hidden="true">
        <div className="ln-orb ln-orb-blue" />
        <div className="ln-orb ln-orb-saffron" />
        <div className="ln-orb ln-orb-leaf" />
      </div>

      <div className="ln-wrap ln-hero-grid">
        <div className="ln-hero-copy">
          <p className="ln-eyebrow ln-hero-eyebrow"><span className="ln-idx">परख</span> Early warning · MoSPI Flash Reports</p>

          <h1 className="ln-display ln-h1 ln-split" aria-label="Spot the projects about to slip, before the report says so.">
            {'Spot the projects about to '.split(' ').map((w, i) => (
              <span key={i} className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner">{w}&nbsp;</span></span>
            ))}
            <span className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner ln-accent">slip,</span></span>
            <span className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner">&nbsp;</span></span>
            {'before the report says so.'.split(' ').map((w, i) => (
              <span key={`b${i}`} className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner">{w}{i < 3 ? '\u00A0' : ''}</span></span>
            ))}
          </h1>

          <p className="ln-lead ln-hero-lead">
            Every month, MoSPI publishes a Flash Report on central infrastructure projects worth ₹150 crore or more.
            Parakh reads those PDFs, scores each project&rsquo;s risk with open rules, and estimates which
            completion dates will move in the next report.
          </p>

          <p className="ln-hero-facts">
            {kErr ? (
              <>The data snapshot did not load. Run <code>python src/run_all.py</code>, then reload.</>
            ) : kpis ? (
              <>
                The {monthLabel(month)} report lists <b className="ln-num">{nf.format(kpis.total_projects)}</b> projects.
                Approved at <b className="ln-num">₹{lakh(kpis.total_original_cost_cr)} lakh crore</b>, they now stand
                at <b className="ln-num">₹{lakh(kpis.total_revised_cost_cr)} lakh crore</b> — up{' '}
                <b className="ln-num ln-up">{overrunPct.toFixed(1)}%</b>.
              </>
            ) : (
              <span className="ln-skel" style={{ width: '80%' }} />
            )}
          </p>

          <div className="ln-actions ln-hero-actions">
            <MagneticButton>
              <a href="#watchlist" className="ln-btn ln-btn-blue" data-cursor>Open the watchlist <ArrowRight size={15} /></a>
            </MagneticButton>
            <MagneticButton>
              <a href="#evidence" className="ln-btn ln-btn-ghost" data-cursor>How well does it predict?</a>
            </MagneticButton>
          </div>
        </div>

        <HeroSlip projects={flagged} month={month} onInspect={onInspect} />
      </div>

      <div className="ln-scroll-hint" aria-hidden="true">Scroll</div>
    </section>
  );
}
