import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Piano, Volume2, VolumeX, Info, RotateCcw } from 'lucide-react';
import { usePianoAudio } from './hooks/usePianoAudio';
import { usePianoKeyboard } from './hooks/usePianoKeyboard';

// 钢琴键配置
type PianoKey = {
  note: string;
  isBlack: boolean;
  keyLabel?: string; // 键盘快捷键标签
};

// 生成两个八度的钢琴键
const PIANO_KEYS: PianoKey[] = [
  // 第一个八度 (C3-B3)
  { note: 'C3', isBlack: false },
  { note: 'C#3', isBlack: true },
  { note: 'D3', isBlack: false },
  { note: 'D#3', isBlack: true },
  { note: 'E3', isBlack: false },
  { note: 'F3', isBlack: false },
  { note: 'F#3', isBlack: true },
  { note: 'G3', isBlack: false },
  { note: 'G#3', isBlack: true },
  { note: 'A3', isBlack: false },
  { note: 'A#3', isBlack: true },
  { note: 'B3', isBlack: false },
  // 第二个八度 (C4-B4)
  { note: 'C4', isBlack: false },
  { note: 'C#4', isBlack: true },
  { note: 'D4', isBlack: false },
  { note: 'D#4', isBlack: true },
  { note: 'E4', isBlack: false },
  { note: 'F4', isBlack: false },
  { note: 'F#4', isBlack: true },
  { note: 'G4', isBlack: false },
  { note: 'G#4', isBlack: true },
  { note: 'A4', isBlack: false },
  { note: 'A#4', isBlack: true },
  { note: 'B4', isBlack: false },
  // 第三个八度部分 (C5-E5)
  { note: 'C5', isBlack: false },
  { note: 'C#5', isBlack: true },
  { note: 'D5', isBlack: false },
  { note: 'D#5', isBlack: true },
  { note: 'E5', isBlack: false },
];

// 分离白键和黑键
const WHITE_KEYS = PIANO_KEYS.filter(k => !k.isBlack);
const BLACK_KEYS = PIANO_KEYS.filter(k => k.isBlack);

// 黑键相对于白键的位置偏移比例
const BLACK_KEY_POSITIONS: Record<string, number> = {
  'C#3': 0.65,
  'D#3': 1.75,
  'F#3': 3.65,
  'G#3': 4.7,
  'A#3': 5.75,
  'C#4': 7.65,
  'D#4': 8.75,
  'F#4': 10.65,
  'G#4': 11.7,
  'A#4': 12.75,
  'C#5': 14.65,
  'D#5': 15.75,
};

// 检测是否为移动设备
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export default function PianoPlayer() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false); // 默认不旋转
  const [showRotateHint, setShowRotateHint] = useState(true); // 显示提示弹窗
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const touchMapRef = useRef<Map<number, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // 检测屏幕方向和尺寸
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      setIsMobile(isMobileDevice());
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // 当设备真正横屏时，自动关闭软件旋转
  useEffect(() => {
    if (isMobile && !isPortrait && autoRotate) {
      setAutoRotate(false);
    }
  }, [isMobile, isPortrait, autoRotate]);

  // 是否需要旋转（移动端 + 竖屏 + 开启自动旋转）
  const shouldRotate = isMobile && isPortrait && autoRotate;
  // 是否显示提示弹窗（移动端 + 竖屏 + 未做选择）
  const showHintModal = isMobile && isPortrait && showRotateHint;

  const { playNote, stopNote, stopAllNotes, getAudioContext } = usePianoAudio();
  const { getKeyForNote } = usePianoKeyboard({
    playNote: note => {
      if (!isMuted) {
        playNote(note);
        setActiveNotes(prev => new Set(prev).add(note));
      }
    },
    stopNote: note => {
      stopNote(note);
      setActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    },
  });

  // 处理音符按下（鼠标/触摸）
  const handleNoteStart = useCallback(
    (note: string, touchId?: number) => {
      // 确保 AudioContext 已启动
      getAudioContext();

      if (!isMuted) {
        playNote(note);
      }
      setActiveNotes(prev => new Set(prev).add(note));

      if (touchId !== undefined) {
        touchMapRef.current.set(touchId, note);
      }
    },
    [isMuted, playNote, getAudioContext]
  );

  // 处理音符释放
  const handleNoteEnd = useCallback(
    (note: string, touchId?: number) => {
      stopNote(note);
      setActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });

      if (touchId !== undefined) {
        touchMapRef.current.delete(touchId);
      }
    },
    [stopNote]
  );

  // 触摸事件处理
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, note: string) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      if (touch) {
        handleNoteStart(note, touch.identifier);
      }
    },
    [handleNoteStart]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const note = touchMapRef.current.get(touch.identifier);
        if (note) {
          handleNoteEnd(note, touch.identifier);
        }
      }
    },
    [handleNoteEnd]
  );

  // 处理触摸移动（滑动到其他琴键）
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const element = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        ) as HTMLElement;
        const newNote = element?.dataset?.note;
        const currentNote = touchMapRef.current.get(touch.identifier);

        if (newNote && newNote !== currentNote) {
          if (currentNote) {
            handleNoteEnd(currentNote, touch.identifier);
          }
          handleNoteStart(newNote, touch.identifier);
        }
      }
    },
    [handleNoteStart, handleNoteEnd]
  );

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (note: string) => {
      handleNoteStart(note);

      const handleMouseUp = () => {
        handleNoteEnd(note);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mouseup', handleMouseUp);
    },
    [handleNoteStart, handleNoteEnd]
  );

  // 窗口失焦时停止所有音符
  useEffect(() => {
    const handleBlur = () => {
      stopAllNotes();
      setActiveNotes(new Set());
      touchMapRef.current.clear();
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [stopAllNotes]);

  // 获取键盘快捷键显示标签
  const getKeyLabel = (note: string): string => {
    const key = getKeyForNote(note);
    if (!key) return '';
    // 特殊字符转换
    if (key === ',') return ',';
    if (key === '.') return '.';
    if (key === '/') return '/';
    if (key === ';') return ';';
    if (key === '[') return '[';
    if (key === ']') return ']';
    if (key === '=') return '=';
    return key.toUpperCase();
  };

  // 渲染白键
  const renderWhiteKey = (key: PianoKey) => {
    const isActive = activeNotes.has(key.note);
    const keyLabel = getKeyLabel(key.note);

    return (
      <div
        key={key.note}
        data-note={key.note}
        className={cn(
          'relative flex-1',
          shouldRotate
            ? 'min-w-0 h-full'
            : 'min-w-[32px] sm:min-w-[40px] md:min-w-[48px] h-36 sm:h-44 md:h-52',
          'rounded-b-lg',
          'border border-zinc-300',
          'cursor-pointer select-none',
          'transition-all duration-75',
          'touch-none',
          isActive
            ? 'bg-zinc-200 shadow-inner translate-y-0.5'
            : 'bg-white shadow-md hover:bg-zinc-50'
        )}
        onMouseDown={() => handleMouseDown(key.note)}
        onTouchStart={e => handleTouchStart(e, key.note)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchCancel={handleTouchEnd}
      >
        {/* 音符名称 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          <span className="block text-[10px] sm:text-xs text-zinc-400">
            {key.note.replace('#', '')}
          </span>
          {keyLabel && !shouldRotate && (
            <span className="block text-[9px] sm:text-[10px] text-zinc-300 mt-0.5">
              {keyLabel}
            </span>
          )}
        </div>
      </div>
    );
  };

  // 渲染黑键
  const renderBlackKey = (key: PianoKey) => {
    const isActive = activeNotes.has(key.note);
    const position = BLACK_KEY_POSITIONS[key.note];
    const keyLabel = getKeyLabel(key.note);

    if (position === undefined) return null;

    return (
      <div
        key={key.note}
        data-note={key.note}
        className={cn(
          'absolute top-0 z-10',
          shouldRotate
            ? 'w-[5%] h-[55%]'
            : 'w-[22px] sm:w-[28px] md:w-[32px] h-20 sm:h-24 md:h-28',
          'rounded-b-md',
          'cursor-pointer select-none',
          'transition-all duration-75',
          'touch-none',
          isActive
            ? 'bg-zinc-600 shadow-inner translate-y-0.5'
            : 'bg-zinc-800 shadow-lg hover:bg-zinc-700'
        )}
        style={{
          left: shouldRotate
            ? `calc(${(position / WHITE_KEYS.length) * 100}% - 2.5%)`
            : `calc(${(position / WHITE_KEYS.length) * 100}% - 11px)`,
        }}
        onMouseDown={() => handleMouseDown(key.note)}
        onTouchStart={e => handleTouchStart(e, key.note)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchCancel={handleTouchEnd}
      >
        {/* 键盘快捷键标签 */}
        {keyLabel && !shouldRotate && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] text-zinc-400">
            {keyLabel}
          </span>
        )}
      </div>
    );
  };

  // 旋转容器的样式
  const rotatedContainerStyle = shouldRotate
    ? {
        width: viewportSize.height,
        height: viewportSize.width,
        transform: 'rotate(90deg)',
        transformOrigin: 'top left',
        position: 'fixed' as const,
        top: 0,
        left: viewportSize.width,
        zIndex: 40,
      }
    : {};

  // 选择横屏模式
  const handleChooseLandscape = () => {
    setShowRotateHint(false);
    setAutoRotate(true);
  };

  // 选择竖屏模式
  const handleChoosePortrait = () => {
    setShowRotateHint(false);
    setAutoRotate(false);
  };

  return (
    <>
      {/* 移动端竖屏提示弹窗 */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="relative">
              <div className="w-16 h-24 border-4 border-white rounded-xl flex items-center justify-center">
                <Piano className="w-8 h-8 text-white" />
              </div>
              <RotateCcw className="absolute -right-3 -bottom-3 w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-white text-lg font-medium">建议横屏使用</p>
              <p className="text-zinc-400 text-sm">
                横屏模式下可获得更好的演奏体验
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleChooseLandscape}
                className="px-6 py-2.5 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
              >
                切换横屏模式
              </button>
              <button
                onClick={handleChoosePortrait}
                className="px-6 py-2 bg-transparent text-zinc-400 rounded-lg font-medium hover:text-white transition-colors"
              >
                继续使用竖屏
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex items-center justify-center',
          shouldRotate ? 'bg-zinc-100' : 'w-full h-full min-h-[400px] p-4'
        )}
        style={rotatedContainerStyle}
      >
        <div
          className={cn(
            'flex flex-col gap-4 p-5',
            'bg-white/95',
            'rounded-xl',
            'border border-zinc-200',
            'shadow-lg shadow-zinc-200/50',
            shouldRotate ? 'w-full h-full max-w-none m-4' : 'w-full max-w-4xl'
          )}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-zinc-100">
                <Piano className="w-5 h-5 text-zinc-600" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-800">
                钢琴演奏器
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* 旋转切换按钮（仅移动端竖屏显示） */}
              {isMobile && isPortrait && !showRotateHint && (
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    autoRotate
                      ? 'bg-zinc-200 text-zinc-700'
                      : 'hover:bg-zinc-100 text-zinc-500'
                  )}
                  title={autoRotate ? '关闭自动横屏' : '开启自动横屏'}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              {/* 帮助按钮 */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showHelp
                    ? 'bg-zinc-200 text-zinc-700'
                    : 'hover:bg-zinc-100 text-zinc-500'
                )}
                title="键盘快捷键帮助"
              >
                <Info className="w-5 h-5" />
              </button>

              {/* 静音按钮 */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isMuted
                    ? 'bg-red-100 text-red-500'
                    : 'hover:bg-zinc-100 text-zinc-500'
                )}
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* 帮助信息（旋转模式下隐藏） */}
          {showHelp && !shouldRotate && (
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <h3 className="text-sm font-medium text-zinc-700 mb-2">
                键盘快捷键
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-600">
                <div>
                  <p className="font-medium text-zinc-700 mb-1">
                    上排键（高音）
                  </p>
                  <p>白键: Q W E R T Y U I O P [ ]</p>
                  <p>黑键: 2 3 5 6 7 9 0 =</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-700 mb-1">
                    下排键（低音）
                  </p>
                  <p>白键: Z X C V B N M , . /</p>
                  <p>黑键: S D G H J L ;</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-3">
                提示：在移动设备上可以同时按多个琴键实现和弦演奏
              </p>
            </div>
          )}

          {/* 钢琴键盘 */}
          <div
            ref={containerRef}
            className={cn(
              'relative',
              'p-3 sm:p-4',
              'bg-zinc-800',
              'rounded-xl',
              'shadow-inner',
              shouldRotate ? 'flex-1 overflow-hidden' : 'overflow-x-auto'
            )}
          >
            <div
              className={cn(
                'relative flex',
                shouldRotate ? 'w-full h-full' : 'min-w-[540px]'
              )}
            >
              {/* 白键 */}
              {WHITE_KEYS.map(key => renderWhiteKey(key))}

              {/* 黑键（覆盖在白键上方） */}
              {BLACK_KEYS.map(key => renderBlackKey(key))}
            </div>
          </div>

          {/* 当前音符显示（旋转模式下隐藏） */}
          {!shouldRotate && (
            <div className="flex items-center justify-center min-h-[32px]">
              {activeNotes.size > 0 ? (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="text-sm text-zinc-500">当前音符:</span>
                  {Array.from(activeNotes).map(note => (
                    <span
                      key={note}
                      className="px-2 py-0.5 bg-zinc-100 rounded text-sm font-mono text-zinc-700"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-zinc-400">
                  点击琴键或使用键盘演奏
                </span>
              )}
            </div>
          )}

          {/* 底部提示（旋转模式下隐藏） */}
          {!shouldRotate && (
            <p className="text-center text-zinc-400 text-xs">
              支持鼠标点击、触摸和键盘演奏 · 移动端支持多点触控
            </p>
          )}
        </div>
      </div>
    </>
  );
}
