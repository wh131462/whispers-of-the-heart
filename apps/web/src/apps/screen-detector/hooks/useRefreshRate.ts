import { useCallback, useEffect, useRef, useState } from 'react';

const COMMON_RATES = [60, 75, 90, 120, 144, 165, 240];
const SAMPLE_FRAMES = 120;

type RefreshRateResult = {
  hz: number | null;
  avgFrameMs: number | null;
  sampling: boolean;
};

function roundToCommonRate(hz: number): number {
  let nearest = COMMON_RATES[0];
  let minDelta = Math.abs(hz - nearest);
  for (const rate of COMMON_RATES) {
    const d = Math.abs(hz - rate);
    if (d < minDelta) {
      minDelta = d;
      nearest = rate;
    }
  }
  return nearest;
}

export function useRefreshRate() {
  const [result, setResult] = useState<RefreshRateResult>({
    hz: null,
    avgFrameMs: null,
    sampling: false,
  });
  const rafRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setResult({ hz: null, avgFrameMs: null, sampling: true });

    const deltas: number[] = [];
    let last = performance.now();
    let count = 0;

    const step = (now: number) => {
      const delta = now - last;
      last = now;
      if (count > 0) deltas.push(delta);
      count++;
      if (count <= SAMPLE_FRAMES) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        const sorted = [...deltas].sort((a, b) => a - b);
        const trimmed = sorted.slice(
          Math.floor(sorted.length * 0.1),
          Math.ceil(sorted.length * 0.9)
        );
        const avg = trimmed.reduce((s, x) => s + x, 0) / trimmed.length;
        const hz = 1000 / avg;
        rafRef.current = null;
        setResult({
          hz: roundToCommonRate(hz),
          avgFrameMs: Number(avg.toFixed(3)),
          sampling: false,
        });
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    measure();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  return { ...result, remeasure: measure };
}
