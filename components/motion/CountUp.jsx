'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

/**
 * Counts a number up from 0 the first time it scrolls into view.
 * Renders the final value server-side (no-JS safe); the tween only
 * rewrites textContent when motion is allowed.
 */
export default function CountUp({ value, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null);
  const final = prefix + Number(value || 0).toFixed(decimals) + suffix;

  useGSAP(() => {
    const el = ref.current;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const obj = { v: 0 };
      gsap.to(obj, {
        v: Number(value || 0),
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = prefix + obj.v.toFixed(decimals) + suffix;
        },
      });
    });
    return () => media.revert();
  }, [value, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {final}
    </span>
  );
}
