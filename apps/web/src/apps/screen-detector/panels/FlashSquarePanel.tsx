import { useEffect, useRef, useState } from 'react';

const FLASH_INTERVAL_MS = 500;

export function FlashSquarePanel() {
  const [on, setOn] = useState(false);
  const [warned, setWarned] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());

  useEffect(() => {
    const stored = window.sessionStorage.getItem(
      'screen-detector:flash-warned'
    );
    if (stored === '1') setWarned(true);
  }, []);

  useEffect(() => {
    if (!warned) return;
    const loop = (now: number) => {
      if (now - lastRef.current >= FLASH_INTERVAL_MS) {
        setOn(v => !v);
        lastRef.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [warned]);

  const dismiss = () => {
    window.sessionStorage.setItem('screen-detector:flash-warned', '1');
    setWarned(true);
  };

  if (!warned) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black p-8">
        <div className="max-w-md rounded-xl border border-zinc-200 bg-white/95 p-6 text-center shadow-lg shadow-zinc-200/50">
          <h3 className="mb-2 text-lg font-semibold text-zinc-900">光敏警告</h3>
          <p className="mb-4 text-sm leading-relaxed text-zinc-600">
            此面板将以约 2Hz
            的频率在黑白之间闪烁。光敏性癫痫或对闪烁敏感的用户请谨慎使用。
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            我已了解，开始测试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full"
      style={{ backgroundColor: on ? '#fff' : '#000' }}
    />
  );
}
