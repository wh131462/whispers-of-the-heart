import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
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
  onSelectColor: (color: Color) => void;
}

const paletteLabels: Record<string, string> = {
  complementary: '互补色',
  triadic: '三等分色',
  analogous: '类似色',
  splitComplementary: '分裂互补',
  tetradic: '四等分色',
  monochromatic: '单色调',
};

export function PaletteDisplay({
  palettes,
  onSelectColor,
}: PaletteDisplayProps) {
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
            {colors.map((color, index) => (
              <div
                key={`${color.hex}-${index}`}
                className="group relative flex-1"
              >
                <button
                  onClick={() => onSelectColor(color)}
                  className={cn(
                    'w-full h-10 rounded transition-transform',
                    'hover:scale-105 hover:z-10',
                    'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  )}
                  style={{ backgroundColor: color.hex }}
                />
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'pointer-events-none'
                  )}
                >
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      copyHex(color.hex);
                    }}
                    className="pointer-events-auto p-1 rounded bg-black/50"
                  >
                    {copiedHex === color.hex ? (
                      <Check
                        className="w-3 h-3"
                        style={{
                          color:
                            getContrastingColor(color.rgb) === 'white'
                              ? 'white'
                              : 'black',
                        }}
                      />
                    ) : (
                      <Copy
                        className="w-3 h-3"
                        style={{
                          color:
                            getContrastingColor(color.rgb) === 'white'
                              ? 'white'
                              : 'black',
                        }}
                      />
                    )}
                  </button>
                </div>
                <span
                  className={cn(
                    'absolute bottom-0 left-0 right-0 text-center',
                    'text-[10px] font-mono py-0.5',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'bg-black/50'
                  )}
                  style={{
                    color:
                      getContrastingColor(color.rgb) === 'white'
                        ? 'white'
                        : 'black',
                  }}
                >
                  {color.hex.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
