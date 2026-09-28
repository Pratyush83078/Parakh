'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

// Spring magnetic pull toward the pointer (awwwards-animations: magnetic button).
export default function MagneticButton({ children, strength = 0.32, className = '' }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 160, damping: 18, mass: 0.6 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  const onMove = (e) => {
    if (reduced || !ref.current || !window.matchMedia('(pointer: fine)').matches) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - left - width / 2) * strength);
    y.set((e.clientY - top - height / 2) * strength);
  };
  const onLeave = () => {
    if (!ref.current) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className={`ln-magnet ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: reduced ? 0 : sx, y: reduced ? 0 : sy }}
    >
      {children}
    </motion.span>
  );
}
