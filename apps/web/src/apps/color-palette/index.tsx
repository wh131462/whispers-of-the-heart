import { Copy, Check, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorPicker } from './components/ColorPicker';
import { ColorInput } from './components/ColorInput';
import { ContrastChecker } from './components/ContrastChecker';
import { PaletteDisplay } from './components/PaletteDisplay';
import { useColorPalette } from './hooks/useColorPalette';

export default function ColorPalette() {
  const {
    color,
    compareColor,
    format,
    copied,
    contrastResult,
    palettes,
    textColor,
    formattedValues,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    setMainColor,
    setCompareColor,
    setFormat,
    copyColor,
    randomColor,
  } = useColorPalette();

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className={cn(
          'flex flex-col gap-4 p-5',
          'bg-white/95',
          'rounded-xl',
          'border border-zinc-200',
          'shadow-lg shadow-zinc-200/50'
        )}
      >
        {/* 颜色预览 */}
        <div
          className="h-24 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: color.hex }}
        >
          <span
            className="text-xl font-mono font-medium"
            style={{ color: textColor }}
          >
            {color.hex.toUpperCase()}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={copyColor}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
              'bg-emerald-100 text-emerald-700',
              'hover:bg-emerald-200 transition-colors',
              'text-sm font-medium'
            )}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={randomColor}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
              'bg-zinc-100 text-zinc-700',
              'hover:bg-zinc-200 transition-colors',
              'text-sm font-medium'
            )}
          >
            <Shuffle className="w-4 h-4" />
            随机
          </button>
        </div>

        {/* 分隔线 */}
        <div className="h-px bg-zinc-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：颜色选择器和输入 */}
          <div className="flex flex-col gap-4">
            <ColorPicker color={color} onChange={setMainColor} />
            <ColorInput
              color={color}
              format={format}
              formattedValues={formattedValues}
              onFormatChange={setFormat}
              onHexChange={setColorFromHex}
              onRgbChange={setColorFromRgb}
              onHslChange={setColorFromHsl}
            />
          </div>

          {/* 右侧：对比度检查 */}
          <div className="flex flex-col gap-4">
            <ContrastChecker
              foreground={color}
              background={compareColor}
              result={contrastResult}
              onBackgroundChange={setCompareColor}
            />
          </div>
        </div>

        {/* 分隔线 */}
        <div className="h-px bg-zinc-200" />

        {/* 配色方案 */}
        <PaletteDisplay palettes={palettes} onSelectColor={setMainColor} />
      </div>
    </div>
  );
}
