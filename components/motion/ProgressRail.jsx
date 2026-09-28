'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

/** Hairline reading-progress rail pinned under the header, ink→blue. */
export default function ProgressRail() {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3, invalidateOnRefresh: true },
      },
    );
  });

  return <div ref={ref} className="ln-progress" aria-hidden="true" />;
}
