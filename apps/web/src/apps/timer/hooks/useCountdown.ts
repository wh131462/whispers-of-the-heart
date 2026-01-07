import { useState, useRef, useCallback, useEffect } from 'react';
import type { CountdownState } from '../types';
import { minutesToMs } from '../utils/formatTime';

const initialState: CountdownState = {
  targetTime: minutesToMs(5), // 默认5分钟
  remainingTime: minutesToMs(5),
  isRunning: false,
  isFinished: false,
};

export function useCountdown() {
  const [state, setState] = useState<CountdownState>(initialState);
  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 开始
  const start = useCallback(() => {
    if (state.isRunning || state.remainingTime <= 0) return;

    endTimeRef.current = Date.now() + state.remainingTime;

    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, endTimeRef.current - Date.now());

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setState(prev => ({
          ...prev,
          remainingTime: 0,
          isRunning: false,
          isFinished: true,
        }));
        // 可以在这里添加音效通知
      } else {
        setState(prev => ({
          ...prev,
          remainingTime: remaining,
        }));
      }
    }, 100);

    setState(prev => ({ ...prev, isRunning: true, isFinished: false }));
  }, [state.isRunning, state.remainingTime]);

  // 暂停
  const pause = useCallback(() => {
    if (!state.isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({ ...prev, isRunning: false }));
  }, [state.isRunning]);

  // 重置
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({
      ...prev,
      remainingTime: prev.targetTime,
      isRunning: false,
      isFinished: false,
    }));
  }, []);

  // 设置目标时间
  const setTargetTime = useCallback((ms: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({
      targetTime: ms,
      remainingTime: ms,
      isRunning: false,
      isFinished: false,
    });
  }, []);

  // 增加时间
  const addTime = useCallback(
    (ms: number) => {
      setState(prev => ({
        ...prev,
        targetTime: prev.targetTime + ms,
        remainingTime: prev.remainingTime + ms,
      }));
      if (state.isRunning) {
        endTimeRef.current += ms;
      }
    },
    [state.isRunning]
  );

  // 切换
  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isRunning, start, pause]);

  return {
    targetTime: state.targetTime,
    remainingTime: state.remainingTime,
    isRunning: state.isRunning,
    isFinished: state.isFinished,
    start,
    pause,
    reset,
    toggle,
    setTargetTime,
    addTime,
  };
}
