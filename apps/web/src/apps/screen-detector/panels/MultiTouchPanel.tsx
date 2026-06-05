import { useCallback, useEffect, useRef } from 'react';

const TRAIL_COLORS = [
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#14b8a6',
];

type Trail = {
  color: string;
  points: { x: number; y: number }[];
};

export function MultiTouchPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailsRef = useRef<Map<number, Trail>>(new Map());
  const nextColorIdxRef = useRef(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const trail of trailsRef.current.values()) {
      ctx.strokeStyle = trail.color;
      ctx.fillStyle = trail.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      trail.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      const last = trail.points[trail.points.length - 1];
      if (last) {
        ctx.beginPath();
        ctx.arc(last.x, last.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    redraw();
  }, [redraw]);

  const clear = useCallback(() => {
    trailsRef.current.clear();
    nextColorIdxRef.current = 0;
    redraw();
  }, [redraw]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') clear();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
    };
  }, [resize, clear]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const color = TRAIL_COLORS[nextColorIdxRef.current % TRAIL_COLORS.length];
    nextColorIdxRef.current++;
    trailsRef.current.set(e.pointerId, { color, points: [getPoint(e)] });
    redraw();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const trail = trailsRef.current.get(e.pointerId);
    if (!trail) return;
    trail.points.push(getPoint(e));
    redraw();
  };

  return (
    <div className="relative h-full w-full bg-zinc-900">
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        className="h-full w-full touch-none"
        style={{ display: 'block' }}
      />
      <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/60 px-3 py-2 text-xs text-white">
        触摸或鼠标拖动以绘制轨迹，按 R 或点击下方按钮清空
      </div>
      <button
        type="button"
        onClick={clear}
        className="absolute bottom-4 right-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm text-zinc-900 hover:bg-white"
      >
        清空轨迹
      </button>
    </div>
  );
}
