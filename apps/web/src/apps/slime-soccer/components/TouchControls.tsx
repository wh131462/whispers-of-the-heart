import { useRef, useCallback, useEffect } from 'react';

export interface TouchInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  grab: boolean;
}

interface TouchControlsProps {
  onInputChange: (input: TouchInputState) => void;
  disabled?: boolean;
}

export default function TouchControls({
  onInputChange,
  disabled = false,
}: TouchControlsProps) {
  const inputRef = useRef<TouchInputState>({
    left: false,
    right: false,
    up: false,
    grab: false,
  });

  const updateInput = useCallback(
    (key: keyof TouchInputState, value: boolean) => {
      if (disabled) return;
      inputRef.current[key] = value;
      onInputChange({ ...inputRef.current });
    },
    [onInputChange, disabled]
  );

  // 重置所有输入
  useEffect(() => {
    if (disabled) {
      inputRef.current = { left: false, right: false, up: false, grab: false };
      onInputChange(inputRef.current);
    }
  }, [disabled, onInputChange]);

  // 通用的触摸事件处理
  const createTouchHandlers = (key: keyof TouchInputState) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      updateInput(key, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      updateInput(key, false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      updateInput(key, false);
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      updateInput(key, true);
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.preventDefault();
      updateInput(key, false);
    },
    onMouseLeave: () => {
      updateInput(key, false);
    },
  });

  return (
    <div className="w-full select-none touch-none">
      {/* 控制器外壳 */}
      <div
        className="relative mx-auto px-4 py-3 rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.5)',
          maxWidth: '400px',
        }}
      >
        {/* 顶部装饰条 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-b-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />

        <div className="flex items-center justify-between">
          {/* 左侧：方向控制 - D-Pad 风格 */}
          <div className="relative w-24 h-24">
            {/* D-Pad 底座 */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(145deg, #1f1f1f, #0a0a0a)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
            />

            {/* 左键 */}
            <button
              {...createTouchHandlers('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center transition-transform active:scale-95"
              style={{
                background: inputRef.current.left
                  ? 'linear-gradient(180deg, #4a4a4a, #3a3a3a)'
                  : 'linear-gradient(180deg, #3a3a3a, #2a2a2a)',
                borderRadius: '8px 4px 4px 8px',
                boxShadow: inputRef.current.left
                  ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
                  : '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* 右键 */}
            <button
              {...createTouchHandlers('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center transition-transform active:scale-95"
              style={{
                background: inputRef.current.right
                  ? 'linear-gradient(180deg, #4a4a4a, #3a3a3a)'
                  : 'linear-gradient(180deg, #3a3a3a, #2a2a2a)',
                borderRadius: '4px 8px 8px 4px',
                boxShadow: inputRef.current.right
                  ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
                  : '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* 中心圆点 */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
              style={{
                background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          {/* 中间：品牌标识区域 */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-[10px] text-gray-500 font-medium tracking-wider">
              SLIME
            </div>
            <div
              className="w-8 h-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, #00bcd4, #f44336)' }}
            />
          </div>

          {/* 右侧：动作按钮 - 双按钮布局 */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* 按钮底座 */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(145deg, #1f1f1f, #0a0a0a)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
            />

            {/* 跳跃按钮 - 上方 */}
            <button
              {...createTouchHandlers('up')}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                background: inputRef.current.up
                  ? 'linear-gradient(180deg, #2e7d32, #1b5e20)'
                  : 'linear-gradient(180deg, #4caf50, #388e3c)',
                boxShadow: inputRef.current.up
                  ? 'inset 0 2px 6px rgba(0,0,0,0.4)'
                  : '0 3px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>

            {/* 抓球按钮 - 下方 */}
            <button
              {...createTouchHandlers('grab')}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                background: inputRef.current.grab
                  ? 'linear-gradient(180deg, #e65100, #bf360c)'
                  : 'linear-gradient(180deg, #ff9800, #f57c00)',
                boxShadow: inputRef.current.grab
                  ? 'inset 0 2px 6px rgba(0,0,0,0.4)'
                  : '0 3px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 底部按钮标签 */}
        <div className="flex justify-between mt-2 px-2 text-[9px] text-gray-500">
          <span>移动</span>
          <span>跳跃 / 抓球</span>
        </div>
      </div>
    </div>
  );
}
