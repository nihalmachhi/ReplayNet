import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * Wraps a section in the reference's `.rv-wrap` scroll-reveal container. The
 * hook arms it on mount and marks it `in` once it is 25% visible.
 */
export function Reveal({ children, className = '', ariaLabel }: RevealProps) {
  const { ref, state } = useReveal<HTMLElement>();
  const classes = ['rv-wrap', state === 'idle' ? '' : 'arm', state === 'in' ? 'in' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <section ref={ref} className={classes} aria-label={ariaLabel}>
      {children}
    </section>
  );
}
