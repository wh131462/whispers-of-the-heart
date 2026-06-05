import { useCallback, useEffect, useRef, useState } from 'react';

const INTERVALS = [1000, 2000, 5000] as const;

export function useAutoCycle(onTick: () => void) {
  const [running, setRunning] = useState(false);
  const [intervalIndex, setIntervalIndex] = useState(1);
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef(onTick);

  useEffect(() => {
    tickRef.current = onTick;
  }, [onTick]);

  const clear = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clear();
    if (running) {
      timerRef.current = window.setInterval(
        () => tickRef.current(),
        INTERVALS[intervalIndex]
      );
    }
    return clear;
  }, [running, intervalIndex]);

  const toggle = useCallback(() => setRunning(r => !r), []);
  const nextInterval = useCallback(
    () => setIntervalIndex(i => (i + 1) % INTERVALS.length),
    []
  );
  const prevInterval = useCallback(
    () => setIntervalIndex(i => (i - 1 + INTERVALS.length) % INTERVALS.length),
    []
  );

  return {
    running,
    intervalMs: INTERVALS[intervalIndex],
    toggle,
    nextInterval,
    prevInterval,
  };
}
