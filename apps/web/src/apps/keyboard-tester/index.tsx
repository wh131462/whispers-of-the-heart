import { useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../../components/ui/button';

// 按键定义类型
interface KeyDef {
  code: string;
  label: string;
  sublabel?: string;
  width?: number; // 基于单位宽度的倍数，默认1
  height?: number; // 基于单位高度的倍数，默认1
}

// 108键键盘布局定义
// 主键盘区域
const MAIN_FUNCTION_ROW: KeyDef[] = [
  { code: 'Escape', label: 'Esc' },
  { code: 'F1', label: 'F1' },
  { code: 'F2', label: 'F2' },
  { code: 'F3', label: 'F3' },
  { code: 'F4', label: 'F4' },
  { code: 'F5', label: 'F5' },
  { code: 'F6', label: 'F6' },
  { code: 'F7', label: 'F7' },
  { code: 'F8', label: 'F8' },
  { code: 'F9', label: 'F9' },
  { code: 'F10', label: 'F10' },
  { code: 'F11', label: 'F11' },
  { code: 'F12', label: 'F12' },
];

const MAIN_NUMBER_ROW: KeyDef[] = [
  { code: 'Backquote', label: '`', sublabel: '~' },
  { code: 'Digit1', label: '1', sublabel: '!' },
  { code: 'Digit2', label: '2', sublabel: '@' },
  { code: 'Digit3', label: '3', sublabel: '#' },
  { code: 'Digit4', label: '4', sublabel: '$' },
  { code: 'Digit5', label: '5', sublabel: '%' },
  { code: 'Digit6', label: '6', sublabel: '^' },
  { code: 'Digit7', label: '7', sublabel: '&' },
  { code: 'Digit8', label: '8', sublabel: '*' },
  { code: 'Digit9', label: '9', sublabel: '(' },
  { code: 'Digit0', label: '0', sublabel: ')' },
  { code: 'Minus', label: '-', sublabel: '_' },
  { code: 'Equal', label: '=', sublabel: '+' },
  { code: 'Backspace', label: 'Backspace', width: 2 },
];

const MAIN_ROW_1: KeyDef[] = [
  { code: 'Tab', label: 'Tab', width: 1.5 },
  { code: 'KeyQ', label: 'Q' },
  { code: 'KeyW', label: 'W' },
  { code: 'KeyE', label: 'E' },
  { code: 'KeyR', label: 'R' },
  { code: 'KeyT', label: 'T' },
  { code: 'KeyY', label: 'Y' },
  { code: 'KeyU', label: 'U' },
  { code: 'KeyI', label: 'I' },
  { code: 'KeyO', label: 'O' },
  { code: 'KeyP', label: 'P' },
  { code: 'BracketLeft', label: '[', sublabel: '{' },
  { code: 'BracketRight', label: ']', sublabel: '}' },
  { code: 'Backslash', label: '\\', sublabel: '|', width: 1.5 },
];

const MAIN_ROW_2: KeyDef[] = [
  { code: 'CapsLock', label: 'Caps Lock', width: 1.75 },
  { code: 'KeyA', label: 'A' },
  { code: 'KeyS', label: 'S' },
  { code: 'KeyD', label: 'D' },
  { code: 'KeyF', label: 'F' },
  { code: 'KeyG', label: 'G' },
  { code: 'KeyH', label: 'H' },
  { code: 'KeyJ', label: 'J' },
  { code: 'KeyK', label: 'K' },
  { code: 'KeyL', label: 'L' },
  { code: 'Semicolon', label: ';', sublabel: ':' },
  { code: 'Quote', label: "'", sublabel: '"' },
  { code: 'Enter', label: 'Enter', width: 2.25 },
];

const MAIN_ROW_3: KeyDef[] = [
  { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
  { code: 'KeyZ', label: 'Z' },
  { code: 'KeyX', label: 'X' },
  { code: 'KeyC', label: 'C' },
  { code: 'KeyV', label: 'V' },
  { code: 'KeyB', label: 'B' },
  { code: 'KeyN', label: 'N' },
  { code: 'KeyM', label: 'M' },
  { code: 'Comma', label: ',', sublabel: '<' },
  { code: 'Period', label: '.', sublabel: '>' },
  { code: 'Slash', label: '/', sublabel: '?' },
  { code: 'ShiftRight', label: 'Shift', width: 2.75 },
];

const MAIN_ROW_4: KeyDef[] = [
  { code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
  { code: 'MetaLeft', label: 'Win', width: 1.25 },
  { code: 'AltLeft', label: 'Alt', width: 1.25 },
  { code: 'Space', label: '', width: 6.25 },
  { code: 'AltRight', label: 'Alt', width: 1.25 },
  { code: 'MetaRight', label: 'Win', width: 1.25 },
  { code: 'ContextMenu', label: 'Menu', width: 1.25 },
  { code: 'ControlRight', label: 'Ctrl', width: 1.25 },
];

// 系统键区域 (Print Screen, Scroll Lock, Pause)
const SYSTEM_ROW_1: KeyDef[] = [
  { code: 'PrintScreen', label: 'PrtSc' },
  { code: 'ScrollLock', label: 'ScrLk' },
  { code: 'Pause', label: 'Pause' },
];

// 编辑键区域
const EDIT_ROW_1: KeyDef[] = [
  { code: 'Insert', label: 'Ins' },
  { code: 'Home', label: 'Home' },
  { code: 'PageUp', label: 'PgUp' },
];

const EDIT_ROW_2: KeyDef[] = [
  { code: 'Delete', label: 'Del' },
  { code: 'End', label: 'End' },
  { code: 'PageDown', label: 'PgDn' },
];

// 方向键区域
const ARROW_KEYS: KeyDef[] = [
  { code: 'ArrowUp', label: '↑' },
  { code: 'ArrowLeft', label: '←' },
  { code: 'ArrowDown', label: '↓' },
  { code: 'ArrowRight', label: '→' },
];

// 数字小键盘区域
const NUMPAD_ROW_1: KeyDef[] = [
  { code: 'NumLock', label: 'Num' },
  { code: 'NumpadDivide', label: '/' },
  { code: 'NumpadMultiply', label: '*' },
  { code: 'NumpadSubtract', label: '-' },
];

const NUMPAD_ROW_2: KeyDef[] = [
  { code: 'Numpad7', label: '7' },
  { code: 'Numpad8', label: '8' },
  { code: 'Numpad9', label: '9' },
];

const NUMPAD_ROW_3: KeyDef[] = [
  { code: 'Numpad4', label: '4' },
  { code: 'Numpad5', label: '5' },
  { code: 'Numpad6', label: '6' },
];

const NUMPAD_ROW_4: KeyDef[] = [
  { code: 'Numpad1', label: '1' },
  { code: 'Numpad2', label: '2' },
  { code: 'Numpad3', label: '3' },
];

const NUMPAD_ROW_5: KeyDef[] = [
  { code: 'Numpad0', label: '0', width: 2 },
  { code: 'NumpadDecimal', label: '.' },
];

// 特殊键：NumpadAdd (高度2), NumpadEnter (高度2)
const NUMPAD_ADD: KeyDef = { code: 'NumpadAdd', label: '+', height: 2 };
const NUMPAD_ENTER: KeyDef = { code: 'NumpadEnter', label: 'Enter', height: 2 };

// 获取所有按键codes
const getAllKeyCodes = (): string[] => {
  const allKeys = [
    ...MAIN_FUNCTION_ROW,
    ...MAIN_NUMBER_ROW,
    ...MAIN_ROW_1,
    ...MAIN_ROW_2,
    ...MAIN_ROW_3,
    ...MAIN_ROW_4,
    ...SYSTEM_ROW_1,
    ...EDIT_ROW_1,
    ...EDIT_ROW_2,
    ...ARROW_KEYS,
    ...NUMPAD_ROW_1,
    ...NUMPAD_ROW_2,
    ...NUMPAD_ROW_3,
    ...NUMPAD_ROW_4,
    ...NUMPAD_ROW_5,
    NUMPAD_ADD,
    NUMPAD_ENTER,
  ];
  return allKeys.map(k => k.code);
};

// 按键组件
interface KeyProps {
  keyDef: KeyDef;
  isPressed: boolean;
  isTested: boolean;
  unitSize?: number;
  gap?: number;
}

function Key({
  keyDef,
  isPressed,
  isTested,
  unitSize = 40,
  gap = 2,
}: KeyProps) {
  // 宽度 = 键宽 * 单位 + (键宽-1) * gap（补偿跨列的gap）
  const keyWidth = keyDef.width || 1;
  const width =
    keyWidth * unitSize + (keyWidth > 1 ? Math.floor(keyWidth - 1) * gap : 0);

  // 高度 = 键高 * 单位 + (键高-1) * gap（补偿跨行的gap）
  const keyHeight = keyDef.height || 1;
  const height =
    keyHeight * unitSize +
    (keyHeight > 1 ? Math.floor(keyHeight - 1) * gap : 0);

  return (
    <div
      className={cn(
        'group relative select-none rounded-md transition-all duration-75 ease-out',
        isPressed ? 'translate-y-0.5' : 'translate-y-0'
      )}
      style={{ width, height }}
    >
      {/* Shadow layer */}
      <span
        className={cn(
          'absolute inset-0 rounded-md transition-all duration-75',
          isTested
            ? 'bg-green-600 dark:bg-green-800'
            : 'bg-neutral-400 dark:bg-neutral-700',
          isPressed ? 'translate-y-0' : 'translate-y-1'
        )}
      />

      {/* Main surface */}
      <span
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center rounded-md border transition-all duration-75',
          isPressed
            ? isTested
              ? 'border-green-400 bg-gradient-to-b from-green-200 to-green-100 dark:border-green-600 dark:from-green-900 dark:to-green-800'
              : 'border-neutral-300 bg-gradient-to-b from-neutral-200 to-neutral-100 dark:border-neutral-600 dark:from-neutral-800 dark:to-neutral-700'
            : isTested
              ? 'border-green-400 bg-gradient-to-b from-green-50 to-green-100 dark:border-green-600 dark:from-green-900/50 dark:to-green-800'
              : 'border-neutral-300 bg-gradient-to-b from-white to-neutral-100 dark:border-neutral-600 dark:from-neutral-700 dark:to-neutral-800'
        )}
      >
        {/* Shine effect */}
        <span
          className={cn(
            'absolute inset-x-1 top-0.5 h-px rounded-full bg-gradient-to-r from-transparent to-transparent transition-opacity duration-75',
            'via-white/40 dark:via-white/20',
            isPressed ? 'opacity-0' : 'opacity-100'
          )}
        />

        {/* Label */}
        <span className="relative z-10 flex flex-col items-center justify-center gap-0 px-0.5">
          {keyDef.sublabel && (
            <span className="text-[8px] font-medium leading-none text-neutral-400 dark:text-neutral-500">
              {keyDef.sublabel}
            </span>
          )}
          <span
            className={cn(
              'text-[9px] font-semibold leading-tight transition-colors duration-75',
              isPressed
                ? 'text-neutral-600 dark:text-neutral-300'
                : isTested
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-neutral-700 dark:text-neutral-300'
            )}
          >
            {keyDef.label}
          </span>
        </span>
      </span>
    </div>
  );
}

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  location: number;
}

export default function KeyboardTester() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  const [lastKeyInfo, setLastKeyInfo] = useState<KeyInfo | null>(null);

  const allKeyCodes = getAllKeyCodes();
  const testedCount = [...testedKeys].filter(k =>
    allKeyCodes.includes(k)
  ).length;
  const totalCount = allKeyCodes.length;
  const progress = Math.round((testedCount / totalCount) * 100);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    const code = e.code;

    setPressedKeys(prev => new Set([...prev, code]));
    setTestedKeys(prev => new Set([...prev, code]));
    setLastKeyInfo({
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      location: e.location,
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    const code = e.code;
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
  }, []);

  const handleReset = () => {
    setTestedKeys(new Set());
    setLastKeyInfo(null);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const unit = 36;
  const gap = 2;

  const renderKey = (keyDef: KeyDef) => (
    <Key
      key={keyDef.code}
      keyDef={keyDef}
      isPressed={pressedKeys.has(keyDef.code)}
      isTested={testedKeys.has(keyDef.code)}
      unitSize={unit}
      gap={gap}
    />
  );

  // 使用绝对定位的行渲染，确保宽度一致
  const renderRow = (keys: KeyDef[], rowWidth: number) => (
    <div className="flex" style={{ width: rowWidth, gap }}>
      {keys.map(k => renderKey(k))}
    </div>
  );

  // 计算主键盘区域宽度：15个单位 + 14个gap（最大键数-1）
  const mainRowWidth = 15 * unit + 13 * gap;

  // 计算3键区域宽度（系统键、编辑键、数字小键盘前3列）
  const threeKeyWidth = 3 * unit + 2 * gap;

  // 计算4键区域宽度（数字小键盘第一行）
  const fourKeyWidth = 4 * unit + 3 * gap;

  return (
    <div className="flex flex-col items-center gap-4 p-4 overflow-x-auto">
      {/* Header */}
      <div className="flex w-full items-center justify-between max-w-4xl">
        <div className="text-sm text-muted-foreground">
          按下键盘上的任意按键进行检测
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </Button>
      </div>

      {/* Progress */}
      <div className="w-full max-w-md">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-muted-foreground">检测进度</span>
          <span className="font-medium">
            {testedCount}/{totalCount} ({progress}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 108键键盘 */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex" style={{ gap: unit * 0.5 }}>
          {/* 左侧：主键盘区域 */}
          <div className="flex flex-col" style={{ gap }}>
            {/* 功能键行 */}
            <div className="flex items-center" style={{ width: mainRowWidth }}>
              {renderKey(MAIN_FUNCTION_ROW[0])}
              <div style={{ width: unit * 0.5 + gap }} />
              <div className="flex" style={{ gap }}>
                {MAIN_FUNCTION_ROW.slice(1, 5).map(k => renderKey(k))}
              </div>
              <div style={{ width: unit * 0.25 + gap }} />
              <div className="flex" style={{ gap }}>
                {MAIN_FUNCTION_ROW.slice(5, 9).map(k => renderKey(k))}
              </div>
              <div style={{ width: unit * 0.25 + gap }} />
              <div className="flex" style={{ gap }}>
                {MAIN_FUNCTION_ROW.slice(9).map(k => renderKey(k))}
              </div>
            </div>

            <div style={{ height: unit * 0.3 }} />

            {/* 主键盘各行 - 使用固定宽度 */}
            {renderRow(MAIN_NUMBER_ROW, mainRowWidth)}
            {renderRow(MAIN_ROW_1, mainRowWidth)}
            {renderRow(MAIN_ROW_2, mainRowWidth)}
            {renderRow(MAIN_ROW_3, mainRowWidth)}
            {renderRow(MAIN_ROW_4, mainRowWidth)}
          </div>

          {/* 中间：系统键 + 编辑键 + 方向键 */}
          <div className="flex flex-col" style={{ gap }}>
            {/* 系统键行 */}
            {renderRow(SYSTEM_ROW_1, threeKeyWidth)}

            <div style={{ height: unit * 0.3 }} />

            {/* 编辑键 */}
            {renderRow(EDIT_ROW_1, threeKeyWidth)}
            {renderRow(EDIT_ROW_2, threeKeyWidth)}

            {/* 空行对齐 */}
            <div style={{ height: unit }} />

            {/* 方向键 */}
            <div
              className="flex flex-col items-center"
              style={{ width: threeKeyWidth, gap }}
            >
              <div className="flex justify-center" style={{ width: '100%' }}>
                {renderKey(ARROW_KEYS[0])}
              </div>
              <div className="flex" style={{ gap }}>
                {renderKey(ARROW_KEYS[1])}
                {renderKey(ARROW_KEYS[2])}
                {renderKey(ARROW_KEYS[3])}
              </div>
            </div>
          </div>

          {/* 右侧：数字小键盘 */}
          <div className="flex flex-col" style={{ gap }}>
            {/* 占位，与功能键行对齐 */}
            <div style={{ height: unit }} />
            <div style={{ height: unit * 0.3 }} />

            {/* 数字小键盘第一行: Num / * - */}
            {renderRow(NUMPAD_ROW_1, fourKeyWidth)}

            {/* 数字小键盘主体：使用网格布局确保对齐 */}
            <div className="flex" style={{ gap }}>
              {/* 左侧 3x4 数字区域 */}
              <div
                className="flex flex-col"
                style={{ width: threeKeyWidth, gap }}
              >
                {renderRow(NUMPAD_ROW_2, threeKeyWidth)}
                {renderRow(NUMPAD_ROW_3, threeKeyWidth)}
                {renderRow(NUMPAD_ROW_4, threeKeyWidth)}
                {renderRow(NUMPAD_ROW_5, threeKeyWidth)}
              </div>
              {/* 右侧 + 和 Enter */}
              <div className="flex flex-col" style={{ gap }}>
                {renderKey({ ...NUMPAD_ADD, height: 2 })}
                {renderKey({ ...NUMPAD_ENTER, height: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Info Panel */}
      <div className="w-full max-w-lg rounded-lg border bg-muted/50 p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          按键信息
        </div>
        {lastKeyInfo ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between rounded bg-background px-3 py-1.5">
              <span className="text-muted-foreground">key</span>
              <span className="font-mono font-medium">
                {lastKeyInfo.key || '(empty)'}
              </span>
            </div>
            <div className="flex justify-between rounded bg-background px-3 py-1.5">
              <span className="text-muted-foreground">code</span>
              <span className="font-mono font-medium text-xs">
                {lastKeyInfo.code}
              </span>
            </div>
            <div className="flex justify-between rounded bg-background px-3 py-1.5">
              <span className="text-muted-foreground">keyCode</span>
              <span className="font-mono font-medium">
                {lastKeyInfo.keyCode}
              </span>
            </div>
            <div className="flex justify-between rounded bg-background px-3 py-1.5">
              <span className="text-muted-foreground">location</span>
              <span className="font-mono font-medium">
                {lastKeyInfo.location}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-3 text-center text-sm text-muted-foreground">
            按下任意按键查看详细信息
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-700" />
          <span>未测试</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-green-400 bg-green-100 dark:border-green-600 dark:bg-green-800" />
          <span>已测试</span>
        </div>
      </div>
    </div>
  );
}
