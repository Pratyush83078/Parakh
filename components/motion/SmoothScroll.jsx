'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { useEffect, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

// Sole smooth-scroll engine. Wired into ScrollTrigger so scrubbed/pinned
// sequences stay in sync. Must be client-only (Lenis reads window).
export default function SmoothScroll({ children }) {
  // Evaluate prefers-reduced-motion only on the client to avoid SSR mismatch.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (reduced) return <>{children}</>;

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
    // Disable GSAP's built-in RAF so Lenis drives the animation loop.
    gsap.ticker.lagSmoothing(0);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    // Let fonts + fetched data settle before measuring pins.
    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    return () => {
      lenis.off('scroll', update);
      gsap.ticker.remove(raf);
      clearTimeout(t);
    };
  }, [lenis]);

  return children;
}
