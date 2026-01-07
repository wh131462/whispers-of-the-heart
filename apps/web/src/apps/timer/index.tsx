import { useState } from 'react';
import type { TimerMode } from './types';
import { TimerShell } from './components/TimerShell';
import { ModeTabs } from './components/ModeTabs';
import { TimerDisplay } from './components/TimerDisplay';
import { TimerControls } from './components/TimerControls';
import { LapList } from './components/LapList';
import { TimeInput } from './components/TimeInput';
import { PomodoroStatus } from './components/PomodoroStatus';
import { useStopwatch } from './hooks/useStopwatch';
import { useCountdown } from './hooks/useCountdown';
import { usePomodoro } from './hooks/usePomodoro';

function StopwatchMode() {
  const { time, isRunning, laps, toggle, reset, lap } = useStopwatch();

  return (
    <>
      <TimerDisplay time={time} />
      <TimerControls
        isRunning={isRunning}
        onToggle={toggle}
        onReset={reset}
        onLap={lap}
        showLap
      />
      <LapList laps={laps} />
    </>
  );
}

function CountdownMode() {
  const { remainingTime, isRunning, isFinished, toggle, reset, setTargetTime } =
    useCountdown();

  return (
    <>
      <TimerDisplay
        time={remainingTime}
        showMilliseconds={false}
        variant={isFinished ? 'warning' : 'default'}
      />
      <TimerControls isRunning={isRunning} onToggle={toggle} onReset={reset} />
      <div className="mt-4 pt-4 border-t border-neutral-800/60">
        <div className="text-xs text-neutral-500 mb-2 text-center">
          设置时间
        </div>
        <TimeInput onSetTime={setTargetTime} disabled={isRunning} />
      </div>
    </>
  );
}

function PomodoroMode() {
  const {
    phase,
    remainingTime,
    currentSession,
    totalSessions,
    isRunning,
    toggle,
    resetPhase,
    skip,
  } = usePomodoro();

  const variant = phase === 'work' ? 'accent' : 'default';

  return (
    <>
      <PomodoroStatus
        phase={phase}
        currentSession={currentSession}
        totalSessions={totalSessions}
      />
      <TimerDisplay
        time={remainingTime}
        showMilliseconds={false}
        variant={variant}
      />
      <TimerControls
        isRunning={isRunning}
        onToggle={toggle}
        onReset={resetPhase}
        onSkip={skip}
        showSkip
      />
    </>
  );
}

export default function Timer() {
  const [mode, setMode] = useState<TimerMode>('stopwatch');

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <TimerShell>
        <ModeTabs activeMode={mode} onModeChange={setMode} />

        <div className="mt-4">
          {mode === 'stopwatch' && <StopwatchMode />}
          {mode === 'countdown' && <CountdownMode />}
          {mode === 'pomodoro' && <PomodoroMode />}
        </div>
      </TimerShell>
    </div>
  );
}
