import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export type RevealState = 'idle' | 'armed' | 'in';

/**
 * Adds the reference's scroll-reveal behaviour: the wrapper is armed, then
 * marked `in` once 25% of it is visible. Under reduced motion it starts `in`
 * so nothing moves.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<RevealState>('idle');

  useEffect(() => {
    if (reduced) {
      setState('in');
      return;
    }
    const element = ref.current;
    if (!element) return;
    setState('armed');
    if (typeof IntersectionObserver !== 'function') {
      setState('in');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState('in');
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced]);

  return { ref, state };
}
