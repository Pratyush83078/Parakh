'use client';

/**
 * Ghost mega-word — a huge outlined serif word floating behind a section.
 * Purely decorative: aria-hidden, non-interactive. Static by design — the old
 * per-section parallax scrub on fullscreen-stroked text repainted constantly
 * while scrolling and was the single worst scroll-jank source.
 */
export default function GhostWord({ word, side = 'right', top = '5rem' }) {
  return (
    <span
      aria-hidden="true"
      className={`ln-ghost ${side === 'left' ? 'is-left' : ''}`}
      style={{ top }}
    >
      {word}
    </span>
  );
}
