'use client';

import { useRef, useEffect } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

/**
 * Counts a number up from 0 the first time it scrolls or opens into view.
 * Works uniformly in window scrolls, dialogs (ProjectDossier), and drawers.
 * Renders final value server-side for hydration safety.
 */
export default function CountUp({ value, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null);
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const target = Number(value || 0);
  const final = prefix + formatter.format(target) + suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) return undefined;

    let tween = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const obj = { v: 0 };
          tween = gsap.to(obj, {
            v: target,
            duration: 1.35,
            ease: 'power2.out',
            onUpdate: () => {
              if (el) el.textContent = prefix + formatter.format(obj.v) + suffix;
            },
          });
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (tween) tween.kill();
    };
  }, [value, decimals, prefix, suffix, target]);

  return (
    <span ref={ref} className={className}>
      {final}
    </span>
  );
}
