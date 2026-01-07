import { useState, useRef, useCallback, useEffect } from 'react';
import type { PomodoroState, PomodoroConfig, PomodoroPhase } from '../types';
import { minutesToMs } from '../utils/formatTime';

const defaultConfig: PomodoroConfig = {
  workMinutes: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4,
};

function getInitialState(config: PomodoroConfig): PomodoroState {
  return {
    phase: 'work',
    remainingTime: minutesToMs(config.workMinutes),
    currentSession: 1,
    totalSessions: 0,
    isRunning: false,
    config,
  };
}

export function usePomodoro(initialConfig?: Partial<PomodoroConfig>) {
  const config = { ...defaultConfig, ...initialConfig };
  const [state, setState] = useState<PomodoroState>(() =>
    getInitialState(config)
  );
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

  // 获取阶段时间
  const getPhaseTime = useCallback(
    (phase: PomodoroPhase): number => {
      switch (phase) {
        case 'work':
          return minutesToMs(state.config.workMinutes);
        case 'shortBreak':
          return minutesToMs(state.config.shortBreak);
        case 'longBreak':
          return minutesToMs(state.config.longBreak);
      }
    },
    [state.config]
  );

  // 进入下一阶段
  const nextPhase = useCallback(() => {
    setState(prev => {
      let nextPh: PomodoroPhase;
      let nextSession = prev.currentSession;
      let totalSessions = prev.totalSessions;

      if (prev.phase === 'work') {
        totalSessions++;
        // 判断是长休息还是短休息
        if (prev.currentSession % prev.config.sessionsBeforeLong === 0) {
          nextPh = 'longBreak';
        } else {
          nextPh = 'shortBreak';
        }
      } else {
        // 休息结束，进入下一个工作阶段
        nextPh = 'work';
        nextSession++;
      }

      const nextTime = getPhaseTime(nextPh);

      return {
        ...prev,
        phase: nextPh,
        remainingTime: nextTime,
        currentSession: nextSession,
        totalSessions,
        isRunning: false,
      };
    });
  }, [getPhaseTime]);

  // 开始
  const start = useCallback(() => {
    if (state.isRunning) return;

    endTimeRef.current = Date.now() + state.remainingTime;

    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, endTimeRef.current - Date.now());

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // 阶段结束
        nextPhase();
      } else {
        setState(prev => ({
          ...prev,
          remainingTime: remaining,
        }));
      }
    }, 100);

    setState(prev => ({ ...prev, isRunning: true }));
  }, [state.isRunning, state.remainingTime, nextPhase]);

  // 暂停
  const pause = useCallback(() => {
    if (!state.isRunning) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({ ...prev, isRunning: false }));
  }, [state.isRunning]);

  // 重置当前阶段
  const resetPhase = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({
      ...prev,
      remainingTime: getPhaseTime(prev.phase),
      isRunning: false,
    }));
  }, [getPhaseTime]);

  // 完全重置
  const resetAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(getInitialState(state.config));
  }, [state.config]);

  // 跳过当前阶段
  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    nextPhase();
  }, [nextPhase]);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<PomodoroConfig>) => {
    setState(prev => {
      const updatedConfig = { ...prev.config, ...newConfig };
      return {
        ...prev,
        config: updatedConfig,
        remainingTime: minutesToMs(
          prev.phase === 'work'
            ? updatedConfig.workMinutes
            : prev.phase === 'shortBreak'
              ? updatedConfig.shortBreak
              : updatedConfig.longBreak
        ),
      };
    });
  }, []);

  // 切换
  const toggle = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isRunning, start, pause]);

  return {
    phase: state.phase,
    remainingTime: state.remainingTime,
    currentSession: state.currentSession,
    totalSessions: state.totalSessions,
    isRunning: state.isRunning,
    config: state.config,
    start,
    pause,
    toggle,
    resetPhase,
    resetAll,
    skip,
    updateConfig,
  };
}
