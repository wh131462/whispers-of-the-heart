// 计时器模式
export type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro';

// 分圈记录
export interface LapRecord {
  id: number;
  time: number; // 毫秒
  diff: number; // 与上一圈的差值
}

// 秒表状态
export interface StopwatchState {
  time: number;
  isRunning: boolean;
  laps: LapRecord[];
}

// 倒计时状态
export interface CountdownState {
  targetTime: number; // 目标时间（毫秒）
  remainingTime: number; // 剩余时间
  isRunning: boolean;
  isFinished: boolean;
}

// 番茄钟配置
export interface PomodoroConfig {
  workMinutes: number; // 工作时间 (默认25)
  shortBreak: number; // 短休息 (默认5)
  longBreak: number; // 长休息 (默认15)
  sessionsBeforeLong: number; // 几轮后长休息 (默认4)
}

// 番茄钟阶段
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

// 番茄钟状态
export interface PomodoroState {
  phase: PomodoroPhase;
  remainingTime: number;
  currentSession: number;
  totalSessions: number;
  isRunning: boolean;
  config: PomodoroConfig;
}
