import { useState, useRef, useCallback, useEffect } from 'react';
import type { StopwatchState, LapRecord } from '../types';

const initialState: StopwatchState = {
  time: 0,
  isRunning: false,
  laps: [],
};

export function useStopwatch() {
  const [state, setState] = useState<StopwatchState>(initialState);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 开始/继续
  const start = useCallback(() => {
    if (state.isRunning) return;

    startTimeRef.current = Date.now();
    accumulatedRef.current = state.time;

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setState(prev => ({
        ...prev,
        time: accumulatedRef.current + elapsed,
      }));
    }, 10);

    setState(prev => ({ ...prev, isRunning: true }));
  }, [state.isRunning, state.time]);

  // 暂停
  const pause = useCallback(() => {
    if (!state.isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    accumulatedRef.current = state.time;
    setState(prev => ({ ...prev, isRunning: false }));
  }, [state.isRunning, state.time]);

  // 重置
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedRef.current = 0;
    setState(initialState);
  }, []);

  // 分圈
  const lap = useCallback(() => {
    if (!state.isRunning && state.time === 0) return;

    const lastLapTime = state.laps.length > 0 ? state.laps[0].time : 0;
    const diff = state.time - lastLapTime;

    const newLap: LapRecord = {
      id: state.laps.length + 1,
      time: state.time,
      diff,
    };

    setState(prev => ({
      ...prev,
      laps: [newLap, ...prev.laps],
    }));
  }, [state.time, state.laps, state.isRunning]);

  // 切换开始/暂停
  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isRunning, start, pause]);

  return {
    time: state.time,
    isRunning: state.isRunning,
    laps: state.laps,
    start,
    pause,
    reset,
    lap,
    toggle,
  };
}
