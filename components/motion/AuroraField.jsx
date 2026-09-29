'use client';

import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

/**
 * Living gradient field — the answer to "static grainy orbs".
 *
 * A tiny canvas (page size ÷ 4) is painted every frame with drifting
 * radial-gradient blobs, then scaled up and CSS-blurred into a slow aurora.
 * One blob eases toward the pointer, so the field visibly answers the cursor.
 * Pauses off-screen; renders a single still frame under reduced motion.
 *
 * palette: 'day'  — paper base, for the hero
 *          'dark' — near-black base, for the evidence room
 */
const FIELDS = {
  day: {
    base: 'rgba(242, 239, 230, 1)',
    blobs: [
      // [x, y, color, radius(frac of min side), speed, phase]
      [0.72, 0.18, 'rgba(35, 55, 224, 0.24)', 0.68, 0.16, 0.0],
      [0.15, 0.52, 'rgba(232, 163, 61, 0.20)', 0.58, 0.13, 1.9],
      [0.55, 0.88, 'rgba(44, 140, 102, 0.16)', 0.55, 0.19, 3.7],
      [0.35, 0.25, 'rgba(138, 116, 255, 0.18)', 0.60, 0.11, 5.1],
      [0.88, 0.65, 'rgba(240, 140, 60, 0.15)', 0.48, 0.21, 2.6],
      [0.20, 0.15, 'rgba(94, 62, 224, 0.14)', 0.45, 0.14, 4.4],
    ],
    pointer: 'rgba(35, 55, 224, 0.20)',
  },
  dark: {
    base: 'rgba(18, 18, 15, 1)',
    blobs: [
      [0.72, 0.15, 'rgba(64, 86, 255, 0.22)', 0.65, 0.15, 0.6],
      [0.18, 0.75, 'rgba(44, 140, 102, 0.16)', 0.55, 0.12, 2.4],
      [0.48, 0.42, 'rgba(106, 74, 255, 0.18)', 0.60, 0.10, 4.2],
      [0.88, 0.85, 'rgba(232, 163, 61, 0.12)', 0.45, 0.20, 1.2],
      [0.32, 0.55, 'rgba(72, 94, 255, 0.14)', 0.48, 0.17, 3.8],
    ],
    pointer: 'rgba(64, 86, 255, 0.20)',
  },
};


export default function AuroraField({ palette = 'day', className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const cfg = FIELDS[palette] || FIELDS.day;

    let w = 0;
    let h = 0;
    let visible = true;
    const pointer = { x: 0.62, y: 0.28, tx: 0.62, ty: 0.28 };

    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      // Quarter resolution is invisible under the CSS blur and keeps the
      // per-frame cost trivial even on the full-bleed hero.
      w = Math.max(2, Math.round(rect.width / 4));
      h = Math.max(2, Math.round(rect.height / 4));
      canvas.width = w;
      canvas.height = h;
    };

    const blob = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    const render = (t) => {
      if (!visible) return;
      ctx.fillStyle = cfg.base;
      ctx.fillRect(0, 0, w, h);
      const min = Math.min(w, h);
      for (const [bx, by, color, rad, sp, ph] of cfg.blobs) {
        const x = (bx + 0.1 * Math.sin(t * sp + ph)) * w;
        const y = (by + 0.12 * Math.cos(t * sp * 0.9 + ph * 1.7)) * h;
        const r = rad * min * (0.86 + 0.14 * Math.sin(t * sp * 1.3 + ph));
        blob(x, y, r, color);
      }
      // Pointer blob trails the cursor with a heavy lerp — felt, not seen moving.
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      blob(pointer.x * w, pointer.y * h, 0.42 * min, cfg.pointer);
    };

    resize();
    if (prefersReducedMotion()) {
      render(7.3); // one settled still frame; no loop, no listeners
      return undefined;
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
    };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '10% 0px' });
    io.observe(canvas);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove, { passive: true });
    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      io.disconnect();
    };
  }, [palette]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
