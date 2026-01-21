import { useCallback, useEffect, useState } from 'react';

// 电脑键盘到钢琴音符的映射（两排按键）
export const KEYBOARD_MAP: Record<string, string> = {
  // 下排白键（低八度）
  z: 'C3',
  x: 'D3',
  c: 'E3',
  v: 'F3',
  b: 'G3',
  n: 'A3',
  m: 'B3',
  ',': 'C4',
  '.': 'D4',
  '/': 'E4',
  // 下排黑键
  s: 'C#3',
  d: 'D#3',
  g: 'F#3',
  h: 'G#3',
  j: 'A#3',
  l: 'C#4',
  ';': 'D#4',
  // 上排白键（高八度）
  q: 'C4',
  w: 'D4',
  e: 'E4',
  r: 'F4',
  t: 'G4',
  y: 'A4',
  u: 'B4',
  i: 'C5',
  o: 'D5',
  p: 'E5',
  '[': 'F5',
  ']': 'G5',
  // 上排黑键
  '2': 'C#4',
  '3': 'D#4',
  '5': 'F#4',
  '6': 'G#4',
  '7': 'A#4',
  '9': 'C#5',
  '0': 'D#5',
  '=': 'F#5',
};

type UsePianoKeyboardProps = {
  playNote: (note: string) => void;
  stopNote: (note: string) => void;
  enabled?: boolean;
};

export function usePianoKeyboard({
  playNote,
  stopNote,
  enabled = true,
}: UsePianoKeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      // 忽略重复按键和输入框中的按键
      if (e.repeat) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const key = e.key.toLowerCase();
      const note = KEYBOARD_MAP[key];

      if (note) {
        e.preventDefault();
        playNote(note);
        setActiveKeys(prev => new Set(prev).add(key));
      }
    },
    [enabled, playNote]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const key = e.key.toLowerCase();
      const note = KEYBOARD_MAP[key];

      if (note) {
        e.preventDefault();
        stopNote(note);
        setActiveKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [enabled, stopNote]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  // 判断某个键是否被按下
  const isKeyActive = useCallback(
    (key: string) => activeKeys.has(key.toLowerCase()),
    [activeKeys]
  );

  // 通过音符获取对应的键盘按键
  const getKeyForNote = useCallback((note: string): string | undefined => {
    return Object.entries(KEYBOARD_MAP).find(([_, n]) => n === note)?.[0];
  }, []);

  return {
    activeKeys,
    isKeyActive,
    getKeyForNote,
    setActiveKeys,
  };
}
