'use client';

import { useRef, useEffect } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

/**
 * Ink dot + trailing ring cursor, blend-difference so it inverts over dark
 * fields. Pointer-fine devices only; body gets `ln-has-cursor` so the native
 * cursor hides while this is mounted (landing route only).
 *
 * States:
 *   links/buttons/[data-cursor]  → ring grows
 *   [data-cursor="View"]         → ring becomes a labelled pill ("View", "Copy"…)
 */
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };
    let visible = false;
    let labelled = false;
    let pressed = false;

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      const hit = e.target.closest?.('[data-cursor], a, button, input, summary, [role="button"]');
      const text = hit?.getAttribute?.('data-cursor') || '';
      const wantLabel = Boolean(hit) && text.length > 0 && text !== 'true';

      if (wantLabel !== labelled) {
        labelled = wantLabel;
        if (labelled) {
          label.textContent = text;
          ring.classList.add('is-label');
          gsap.to(ring, { scale: 1, width: 62, height: 62, margin: -31, duration: 0.4, ease: 'power3.out' });
          gsap.to(dot, { autoAlpha: 0, duration: 0.2 });
        } else {
          ring.classList.remove('is-label');
          gsap.set(ring, { width: 34, height: 34, margin: -17 });
          gsap.to(ring, { scale: hit ? 2.1 : 1, duration: 0.35, ease: 'power3.out' });
          gsap.to(dot, { autoAlpha: 1, scale: hit ? 0.4 : 1, duration: 0.35, ease: 'power3.out' });
        }
      } else if (!labelled) {
        gsap.to(ring, { scale: hit ? 2.1 : 1, duration: 0.35, ease: 'power3.out' });
        gsap.to(dot, { scale: hit ? 0.4 : 1, duration: 0.35, ease: 'power3.out' });
      }
    };
    const onDown = () => {
      pressed = true;
      gsap.to(ring, { scale: labelled ? 0.9 : 0.7, duration: 0.16 });
    };
    const onUp = () => {
      pressed = false;
      gsap.to(ring, { scale: labelled ? 1 : 1.6, duration: 0.3, ease: 'power3.out' });
    };
    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 });
    };

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.16;
      ringPos.y += (pos.y - ringPos.y) * 0.16;
      gsap.set(dot, { x: pos.x, y: pos.y });
      gsap.set(ring, { x: ringPos.x, y: ringPos.y });
    };
    gsap.ticker.add(tick);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.body.classList.add('ln-has-cursor');

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.body.classList.remove('ln-has-cursor');
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="ln-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="ln-cursor-ring" aria-hidden="true">
        <span ref={labelRef} className="ln-cursor-text" />
      </div>
    </>
  );
}
