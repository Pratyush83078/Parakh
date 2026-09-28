'use client';

import { useEffect, useRef } from 'react';

// Native modal: focus containment, Escape, and an inert background in all routes.
export default function Modal({ children, onClose, className, labelledBy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector('[data-initial-focus]')?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog ref={ref} className={className} aria-labelledby={labelledBy} data-lenis-prevent
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
      }}>
      {children}
    </dialog>
  );
}
