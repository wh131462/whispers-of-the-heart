import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Color, ColorFormat } from '../types';
import { isValidHex } from '../utils/convert';

interface ColorInputProps {
  color: Color;
  format: ColorFormat;
  formattedValues: {
    hex: string;
    rgb: string;
    hsl: string;
  };
  onFormatChange: (format: ColorFormat) => void;
  onHexChange: (hex: string) => void;
  onRgbChange: (r: number, g: number, b: number) => void;
  onHslChange: (h: number, s: number, l: number) => void;
}

export function ColorInput({
  color,
  format,
  formattedValues,
  onFormatChange,
  onHexChange,
  onRgbChange,
  onHslChange,
}: ColorInputProps) {
  const [hexInput, setHexInput] = useState(color.hex);

  useEffect(() => {
    setHexInput(color.hex);
  }, [color.hex]);

  const handleHexSubmit = () => {
    if (isValidHex(hexInput)) {
      onHexChange(hexInput);
    } else {
      setHexInput(color.hex);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 格式切换 */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg self-start">
        {(['hex', 'rgb', 'hsl'] as ColorFormat[]).map(f => (
          <button
            key={f}
            onClick={() => onFormatChange(f)}
            className={cn(
              'px-3 py-1 rounded text-xs font-medium uppercase transition-colors',
              format === f
                ? 'bg-white text-zinc-800 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 输入区域 */}
      {format === 'hex' && (
        <input
          type="text"
          value={hexInput}
          onChange={e => setHexInput(e.target.value)}
          onBlur={handleHexSubmit}
          onKeyDown={e => e.key === 'Enter' && handleHexSubmit()}
          className={cn(
            'w-full px-3 py-2',
            'bg-zinc-50 rounded-lg',
            'border border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
            'text-zinc-800 text-sm font-mono uppercase',
            'focus:outline-none transition-colors'
          )}
        />
      )}

      {format === 'rgb' && (
        <div className="flex gap-2">
          {['r', 'g', 'b'].map(channel => (
            <div key={channel} className="flex-1">
              <label className="text-xs text-zinc-600 uppercase mb-1 block">
                {channel}
              </label>
              <input
                type="number"
                min={0}
                max={255}
                value={color.rgb[channel as keyof typeof color.rgb]}
                onChange={e => {
                  const val = Math.max(
                    0,
                    Math.min(255, parseInt(e.target.value) || 0)
                  );
                  onRgbChange(
                    channel === 'r' ? val : color.rgb.r,
                    channel === 'g' ? val : color.rgb.g,
                    channel === 'b' ? val : color.rgb.b
                  );
                }}
                className={cn(
                  'w-full px-2 py-2',
                  'bg-zinc-50 rounded-lg',
                  'border border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
                  'text-zinc-800 text-sm font-mono text-center',
                  'focus:outline-none transition-colors'
                )}
              />
            </div>
          ))}
        </div>
      )}

      {format === 'hsl' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-zinc-600 mb-1 block">H</label>
            <input
              type="number"
              min={0}
              max={360}
              value={color.hsl.h}
              onChange={e => {
                const val = Math.max(
                  0,
                  Math.min(360, parseInt(e.target.value) || 0)
                );
                onHslChange(val, color.hsl.s, color.hsl.l);
              }}
              className={cn(
                'w-full px-2 py-2',
                'bg-zinc-50 rounded-lg',
                'border border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
                'text-zinc-800 text-sm font-mono text-center',
                'focus:outline-none transition-colors'
              )}
            />
          </div>
          {['s', 'l'].map(channel => (
            <div key={channel} className="flex-1">
              <label className="text-xs text-zinc-600 uppercase mb-1 block">
                {channel}%
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={color.hsl[channel as keyof typeof color.hsl]}
                onChange={e => {
                  const val = Math.max(
                    0,
                    Math.min(100, parseInt(e.target.value) || 0)
                  );
                  onHslChange(
                    color.hsl.h,
                    channel === 's' ? val : color.hsl.s,
                    channel === 'l' ? val : color.hsl.l
                  );
                }}
                className={cn(
                  'w-full px-2 py-2',
                  'bg-zinc-50 rounded-lg',
                  'border border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200',
                  'text-zinc-800 text-sm font-mono text-center',
                  'focus:outline-none transition-colors'
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* 显示其他格式值 */}
      <div className="text-xs text-zinc-600 font-mono space-y-1">
        {format !== 'hex' && <div>{formattedValues.hex}</div>}
        {format !== 'rgb' && <div>{formattedValues.rgb}</div>}
        {format !== 'hsl' && <div>{formattedValues.hsl}</div>}
      </div>
    </div>
  );
}
