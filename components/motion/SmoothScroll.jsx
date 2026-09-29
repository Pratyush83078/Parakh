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

  return (
    <ReactLenis root options={{ lerp: 0.11, duration: 1.15, autoRaf: false, smoothWheel: !reduced, anchors: true, prevent: () => Boolean(document.querySelector('dialog[open]')) }}>
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
    // One RAF owner: GSAP ticks Lenis (autoRaf is disabled above).
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    // Let fonts + fetched data settle before measuring pins.
    const t = setTimeout(() => ScrollTrigger.refresh(), 700);

    const checkModal = () => {
      if (document.querySelector('dialog[open]')) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });

    return () => {
      observer.disconnect();
      lenis.off('scroll', update);
      gsap.ticker.remove(raf);
      clearTimeout(t);
    };
  }, [lenis]);

  return children;
}
