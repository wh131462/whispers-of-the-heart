import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Color } from '../types';
import { getContrastingColor } from '../utils/contrast';

interface PaletteDisplayProps {
  palettes: {
    complementary: Color[];
    triadic: Color[];
    analogous: Color[];
    splitComplementary: Color[];
    tetradic: Color[];
    monochromatic: Color[];
  };
}

const paletteLabels: Record<string, string> = {
  complementary: '互补色',
  triadic: '三等分色',
  analogous: '类似色',
  splitComplementary: '分裂互补',
  tetradic: '四等分色',
  monochromatic: '单色调',
};

export function PaletteDisplay({ palettes }: PaletteDisplayProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
    } catch {
      // 复制失败时静默处理
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="text-xs font-medium text-zinc-600">配色方案</label>

      {Object.entries(palettes).map(([key, colors]) => (
        <div key={key} className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500">{paletteLabels[key]}</span>
          <div className="flex gap-1">
            {colors.map((color, index) => {
              const fgColor =
                getContrastingColor(color.rgb) === 'white' ? 'white' : 'black';
              const isCopied = copiedHex === color.hex;
              return (
                <div
                  key={`${color.hex}-${index}`}
                  className="group relative flex-1"
                >
                  <button
                    onClick={() => copyHex(color.hex)}
                    title={`点击复制 ${color.hex.toUpperCase()}`}
                    className={cn(
                      'w-full h-10 rounded transition-transform cursor-pointer',
                      'hover:scale-105 hover:z-10',
                      'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 right-0 text-center',
                      'text-[10px] font-mono py-0.5',
                      'transition-opacity pointer-events-none',
                      isCopied
                        ? 'opacity-100 bg-black/60'
                        : 'opacity-0 group-hover:opacity-100 bg-black/50'
                    )}
                    style={{ color: fgColor }}
                  >
                    {isCopied ? '已复制' : color.hex.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
