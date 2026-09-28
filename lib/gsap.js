'use client';

// Single registration point for GSAP + React hook (awwwards-animations skill pattern).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: 'power3.out', duration: 0.9 });

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger, useGSAP };
