import { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Color } from '../types';
import { hsvToRgb, rgbToHsv } from '../utils/convert';
import { createColorFromRgb } from '../utils/convert';

interface ColorPickerProps {
  color: Color;
  onChange: (color: Color) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHueDragging, setIsHueDragging] = useState(false);

  const hsv = rgbToHsv(color.rgb);

  // 绘制颜色面板
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 绘制饱和度-明度渐变
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = (x / width) * 100;
        const v = (1 - y / height) * 100;
        const rgb = hsvToRgb({ h: hsv.h, s, v });
        ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hsv.h]);

  // 绘制色相条
  useEffect(() => {
    const canvas = hueRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 30) {
      const rgb = hsvToRgb({ h: i, s: 100, v: 100 });
      gradient.addColorStop(i / 360, `rgb(${rgb.r},${rgb.g},${rgb.b})`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  // 处理颜色面板点击
  const handleCanvasInteraction = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      const s = (x / rect.width) * 100;
      const v = (1 - y / rect.height) * 100;

      const rgb = hsvToRgb({ h: hsv.h, s, v });
      onChange(createColorFromRgb(rgb));
    },
    [hsv.h, onChange]
  );

  // 处理色相条点击
  const handleHueInteraction = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const canvas = hueRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const h = (x / rect.width) * 360;

      const rgb = hsvToRgb({ h, s: hsv.s, v: hsv.v });
      onChange(createColorFromRgb(rgb));
    },
    [hsv.s, hsv.v, onChange]
  );

  // 鼠标事件处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleCanvasInteraction(e);
      } else if (isHueDragging) {
        handleHueInteraction(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsHueDragging(false);
    };

    if (isDragging || isHueDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    isHueDragging,
    handleCanvasInteraction,
    handleHueInteraction,
  ]);

  // 计算指示器位置
  const markerX = (hsv.s / 100) * 200;
  const markerY = (1 - hsv.v / 100) * 150;
  const hueMarkerX = (hsv.h / 360) * 200;

  return (
    <div className="flex flex-col gap-3">
      {/* 颜色面板 */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={150}
          className={cn(
            'w-full h-[150px] rounded-lg cursor-crosshair',
            'border border-neutral-700/50'
          )}
          onMouseDown={e => {
            setIsDragging(true);
            handleCanvasInteraction(e);
          }}
        />
        {/* 选择指示器 */}
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
          style={{
            left: markerX - 8,
            top: markerY - 8,
            backgroundColor: color.hex,
          }}
        />
      </div>

      {/* 色相条 */}
      <div className="relative">
        <canvas
          ref={hueRef}
          width={200}
          height={16}
          className={cn(
            'w-full h-4 rounded cursor-pointer',
            'border border-neutral-700/50'
          )}
          onMouseDown={e => {
            setIsHueDragging(true);
            handleHueInteraction(e);
          }}
        />
        {/* 色相指示器 */}
        <div
          className="absolute top-0 w-1 h-4 bg-white border border-neutral-400 rounded-sm pointer-events-none"
          style={{
            left: hueMarkerX - 2,
          }}
        />
      </div>
    </div>
  );
}
