'use client';

import { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// Spring magnetic pull toward the pointer (awwwards-animations: magnetic button).
export default function MagneticButton({ children, strength = 0.32, className = '' }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const onMove = (e) => {
    if (reduced || !ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${(e.clientX - left - width / 2) * strength}px`);
    ref.current.style.setProperty('--my', `${(e.clientY - top - height / 2) * strength}px`);
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty('--mx', '0px');
    ref.current.style.setProperty('--my', '0px');
  };

  return (
    <motion.span
      ref={ref}
      className={`ln-magnet ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ x: 'var(--mx, 0px)', y: 'var(--my, 0px)' }}
      transition={{ type: 'spring', stiffness: 160, damping: 15, mass: 0.6 }}
    >
      {children}
    </motion.span>
  );
}
