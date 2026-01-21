import { useCallback, useRef } from 'react';

// 音符频率表（A4 = 440Hz 标准）
const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81,
  'C#3': 138.59,
  D3: 146.83,
  'D#3': 155.56,
  E3: 164.81,
  F3: 174.61,
  'F#3': 185.0,
  G3: 196.0,
  'G#3': 207.65,
  A3: 220.0,
  'A#3': 233.08,
  B3: 246.94,
  C4: 261.63,
  'C#4': 277.18,
  D4: 293.66,
  'D#4': 311.13,
  E4: 329.63,
  F4: 349.23,
  'F#4': 369.99,
  G4: 392.0,
  'G#4': 415.3,
  A4: 440.0,
  'A#4': 466.16,
  B4: 493.88,
  C5: 523.25,
  'C#5': 554.37,
  D5: 587.33,
  'D#5': 622.25,
  E5: 659.25,
  F5: 698.46,
  'F#5': 739.99,
  G5: 783.99,
  'G#5': 830.61,
  A5: 880.0,
  'A#5': 932.33,
  B5: 987.77,
  C6: 1046.5,
};

type ActiveNote = {
  oscillators: OscillatorNode[];
  gainNode: GainNode;
};

export function usePianoAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNotesRef = useRef<Map<string, ActiveNote>>(new Map());

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playNote = useCallback(
    (note: string) => {
      const frequency = NOTE_FREQUENCIES[note];
      if (!frequency) return;

      // 防止重复播放同一音符
      if (activeNotesRef.current.has(note)) return;

      const audioContext = getAudioContext();
      const currentTime = audioContext.currentTime;

      // 创建主增益节点
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      masterGain.gain.setValueAtTime(0, currentTime);
      masterGain.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);

      const oscillators: OscillatorNode[] = [];

      // 基频振荡器（正弦波）
      const osc1 = audioContext.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, currentTime);

      const gain1 = audioContext.createGain();
      gain1.gain.setValueAtTime(0.6, currentTime);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      oscillators.push(osc1);

      // 二次泛音（轻微）
      const osc2 = audioContext.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency * 2, currentTime);

      const gain2 = audioContext.createGain();
      gain2.gain.setValueAtTime(0.2, currentTime);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      oscillators.push(osc2);

      // 三次泛音（更轻微）
      const osc3 = audioContext.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(frequency * 3, currentTime);

      const gain3 = audioContext.createGain();
      gain3.gain.setValueAtTime(0.1, currentTime);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      oscillators.push(osc3);

      // 启动所有振荡器
      oscillators.forEach(osc => osc.start(currentTime));

      // 存储活动音符
      activeNotesRef.current.set(note, {
        oscillators,
        gainNode: masterGain,
      });
    },
    [getAudioContext]
  );

  const stopNote = useCallback((note: string) => {
    const activeNote = activeNotesRef.current.get(note);
    if (!activeNote) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const currentTime = audioContext.currentTime;
    const { oscillators, gainNode } = activeNote;

    // 平滑释放
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3);

    // 延迟停止振荡器
    setTimeout(() => {
      oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // 忽略已停止的振荡器错误
        }
      });
      gainNode.disconnect();
    }, 350);

    activeNotesRef.current.delete(note);
  }, []);

  const stopAllNotes = useCallback(() => {
    activeNotesRef.current.forEach((_, note) => {
      stopNote(note);
    });
  }, [stopNote]);

  return {
    playNote,
    stopNote,
    stopAllNotes,
    getAudioContext,
  };
}
