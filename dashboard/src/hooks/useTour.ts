import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const FADE_MS = 230;

/**
 * Drives the five-tab hero tour. The CSS progress bar decides when to advance
 * (its `animationend` calls `onBarEnd`), while hover, focus, the pause button,
 * a hidden document and an off-screen window all suspend it. Reduced motion
 * disables both the fade and the auto-advance.
 */
export function useTour(count: number) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [out, setOut] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback(
    (next: number) => {
      const target = ((next % count) + count) % count;
      if (reduced) {
        setIndex(target);
        return;
      }
      setOut(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setIndex(target);
        setOut(false);
        timer.current = null;
      }, FADE_MS);
    },
    [count, reduced],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const element = winRef.current;
    if (!element || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? true),
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const holdActive = hold || paused || !visible || reduced;

  const onBarEnd = useCallback(() => {
    if (holdActive) return;
    show(index + 1);
  }, [holdActive, index, show]);

  const togglePause = useCallback(() => setPaused((value) => !value), []);

  return {
    index,
    show,
    out,
    paused,
    togglePause,
    hold,
    setHold,
    visible,
    reduced,
    holdActive,
    winRef,
    onBarEnd,
  };
}

export type TourState = ReturnType<typeof useTour>;
