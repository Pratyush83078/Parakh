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
    const focusTarget = () => {
      const el = dialog.querySelector('[data-initial-focus]') || dialog.querySelector('button');
      el?.focus({ preventScroll: true });
    };
    focusTarget();
    const raf = requestAnimationFrame(focusTarget);
    const timer = setTimeout(focusTarget, 60);
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const dialog = ref.current;
    if (!dialog) return;
    const focusables = Array.from(dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary')).filter(el => el.offsetParent !== null || el.getClientRects().length > 0);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !dialog.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <dialog ref={ref} className={className} aria-labelledby={labelledBy} data-lenis-prevent
      onKeyDown={handleKeyDown}
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
