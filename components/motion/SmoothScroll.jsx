'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { useEffect } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

// Sole smooth-scroll engine for the landing story. Wired into ScrollTrigger
// so scrubbed/pinned sequences stay in sync (skill: Lenis + GSAP integration).
export default function SmoothScroll({ children }) {
  const reduced = prefersReducedMotion();

  if (reduced) return children;
  return (
    <ReactLenis root options={{ lerp: 0.11, duration: 1.15, smoothWheel: true }}>
      <ScrollSync>{children}</ScrollSync>
    </ReactLenis>
  );
}

function ScrollSync({ children }) {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return undefined;
    const update = () => ScrollTrigger.update();
    lenis.on('scroll', update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // Let dynamic content (fonts, fetched data) settle before measuring pins.
    const t = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      lenis.off('scroll', update);
      gsap.ticker.remove(raf);
      clearTimeout(t);
    };
  }, [lenis]);

  return children;
}
