'use client';

import { useRef, useEffect } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

// Ink dot + trailing ring cursor, blend-difference so it inverts over dark
// fields. Grows over anything tagged [data-cursor]. Pointer-fine devices only.
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };
    let visible = false;

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      const interactive = e.target.closest?.('[data-cursor], a, button, input, summary, [role="button"]');
      gsap.to(ring, { scale: interactive ? 2.1 : 1, duration: 0.35, ease: 'power3.out' });
      gsap.to(dot, { scale: interactive ? 0.4 : 1, duration: 0.35, ease: 'power3.out' });
    };
    const onLeave = () => { visible = false; gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 }); };

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.16;
      ringPos.y += (pos.y - ringPos.y) * 0.16;
      gsap.set(dot, { x: pos.x, y: pos.y });
      gsap.set(ring, { x: ringPos.x, y: ringPos.y });
    };
    gsap.ticker.add(tick);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.body.classList.add('ln-has-cursor');

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.body.classList.remove('ln-has-cursor');
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="ln-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="ln-cursor-ring" aria-hidden="true" />
    </>
  );
}
