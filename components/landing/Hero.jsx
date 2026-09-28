'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import AuroraField from '@/components/motion/AuroraField';
import MagneticButton from '@/components/motion/MagneticButton';
import { fmtCr, cleanState } from '@/lib/api';
import { monthLabel } from '@/lib/monthLabel';

const nf = new Intl.NumberFormat('en-IN');
export const lakh = (cr) => (cr == null ? '—' : (cr / 1e5).toFixed(2));
export { monthLabel };
const shortMinistry = (m) => (m || '').replace(/^(Ministry|Department) of /, '');

/* ── Proof card: one real flagged project, annotated ─────────────────────── */
export function HeroSlip({ projects, month, onInspect, loading, error }) {
  const [i, setI] = useState(0);
  const cardRef = useRef(null);
  const p = projects[i];

  const { contextSafe } = useGSAP({ scope: cardRef });
  const next = contextSafe(() => {
    if (!projects.length) return;
    setI(index => (index + 1) % projects.length);
    if (prefersReducedMotion() || !cardRef.current) return;
    // Keep the card's scroll transform independent of its record-change animation.
    gsap.fromTo(cardRef.current, { opacity: 0.45 }, { opacity: 1, duration: 0.45, overwrite: 'auto' });
  });

  if (!p && !loading) {
    return <aside className="ln-slip"><h2 className="ln-slip-title">{error ? 'Project preview unavailable' : 'No priority records found'}</h2><p className="ln-body">{error ? 'The project snapshot could not load. Try reloading the page.' : 'Browse the full directory to explore the latest snapshot.'}</p><a href="/projects" className="ln-btn ln-btn-ghost">Open project directory</a></aside>;
  }
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
          <span className="ln-read-value">{p.schedule_slipped_risk_pct != null ? `${p.schedule_slipped_risk_pct.toFixed(0)} / 100` : '—'}</span>
          <span className="ln-read-note">uncalibrated ranking score</span>
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
export default function Hero({ kpis, kErr, flagged, flaggedLoading, flaggedError, onInspect }) {
  const root = useRef(null);
  const month = kpis?.report_month;
  const overrunPct = kpis
    ? ((kpis.total_revised_cost_cr - kpis.total_original_cost_cr) / kpis.total_original_cost_cr) * 100
    : null;

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    const fine = window.matchMedia('(pointer: fine)').matches;

    // Intro timeline: eyebrow → headline lines → lead → facts → CTAs → card.
    const tl = gsap.timeline({ delay: 0.25 });
    tl.from(q('.ln-hero-eyebrow'), { y: 24, autoAlpha: 0, duration: 0.8 }, 0)
      .from(q('.ln-h1 .ln-w-inner'), { yPercent: 118, rotate: 3, duration: 1.25, stagger: 0.05, ease: 'power4.out' }, 0.1)
      .from(q('.ln-hero-lead'), { y: 30, autoAlpha: 0, duration: 0.9 }, 0.55)
      .from(q('.ln-hero-facts'), { y: 26, autoAlpha: 0, duration: 0.9 }, 0.7)
      .from(q('.ln-hero-actions > *'), { y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.09 }, 0.82)
      .from(q('.ln-slip'), { y: 60, autoAlpha: 0, rotate: 5, duration: 1.2, ease: 'power4.out' }, 0.65)
      .from(q('.ln-scroll-hint'), { autoAlpha: 0, duration: 0.8 }, 1.3);

    // Drift exit: every copy block leaves at its own depth while scrolling.
    q('[data-drift]').forEach((el) => {
      gsap.to(el, {
        y: () => -76 * parseFloat(el.dataset.drift || '0.5'),
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    // Proof card straightens and lifts away as you leave the hero.
    gsap.to(q('.ln-slip-scrub'), {
      rotate: 0, y: -56, ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
    });

    // Idle breath + pointer tilt on the card. Runs on the card itself so the
    // scroll scrub (on the wrapper) never fights it for the same property.
    const card = root.current.querySelector('.ln-slip');
    if (card) {
      gsap.to(card, { y: -9, duration: 2.8, delay: 1.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      if (fine) {
        gsap.set(card, { transformPerspective: 900 });
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        const onTilt = (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ry(px * 7);
          rx(py * -7);
        };
        const onFlat = () => { rx(0); ry(0); };
        const zone = root.current;
        zone.addEventListener('mousemove', onTilt, { passive: true });
        zone.addEventListener('mouseleave', onFlat);
        return () => {
          zone.removeEventListener('mousemove', onTilt);
          zone.removeEventListener('mouseleave', onFlat);
        };
      }
    }
  }, { scope: root });

  return (
    <section ref={root} className="ln-hero" id="top">
      <div className="ln-aurora" aria-hidden="true">
        <AuroraField palette="day" />
      </div>

      <div className="ln-wrap ln-hero-grid">
        <div className="ln-hero-copy">
          <p className="ln-eyebrow ln-hero-eyebrow" data-drift="0.35"><span className="ln-idx">परख</span> Early warning · MoSPI Flash Reports</p>

          <h1 className="ln-display ln-h1 ln-split" data-drift="1" aria-label="Spot the projects about to slip, before the report says so.">
            {'Spot the projects about to '.split(' ').map((w, i) => (
              <span key={i} className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner">{w}&nbsp;</span></span>
            ))}
            <span className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner ln-accent">slip,</span></span>
            <span className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner">&nbsp;</span></span>
            {'before the report says so.'.split(' ').map((w, i) => (
              <span key={`b${i}`} className="ln-w-mask" aria-hidden="true"><span className="ln-w-inner">{w}{i < 4 ? '\u00A0' : ''}</span></span>
            ))}
          </h1>

          <p className="ln-lead ln-hero-lead" data-drift="0.65">
            Every month, MoSPI publishes a Flash Report on central infrastructure projects worth ₹150 crore or more.
            Parakh reads those PDFs, scores each project&rsquo;s risk with open rules, and estimates which
            completion dates will move in the next report.
          </p>

          <p className="ln-hero-facts" data-drift="0.5">
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

          <div className="ln-actions ln-hero-actions" data-drift="0.4">
            <MagneticButton>
              <a href="#watchlist" className="ln-btn ln-btn-blue" data-cursor>Open the watchlist <ArrowRight size={15} /></a>
            </MagneticButton>
            <MagneticButton>
              <a href="#evidence" className="ln-btn ln-btn-ghost" data-cursor>How well does it predict?</a>
            </MagneticButton>
          </div>
        </div>

        <div className="ln-slip-scrub">
          <HeroSlip projects={flagged} month={month} onInspect={onInspect} loading={flaggedLoading} error={flaggedError} />
        </div>
      </div>

      <div className="ln-scroll-hint" aria-hidden="true">Scroll</div>
    </section>
  );
}
