'use client';

import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type FallingPatternProps = React.ComponentProps<'div'> & {
  /** Primary color of the falling elements (default: 'var(--primary)') */
  color?: string;
  /** Background color (default: 'var(--background)') */
  backgroundColor?: string;
  /** Animation duration in seconds (default: 150) */
  duration?: number;
  /** Blur intensity for the overlay effect (default: '1em') */
  blurIntensity?: string;
  /** Pattern density - affects spacing (default: 1) */
  density?: number;
};

type RowConfig = {
  sizeY: number;
  cycles: number;
  bgPosition: string;
  buildGradients: (color: string) => string;
};

const ROWS: readonly RowConfig[] = [
  {
    sizeY: 235,
    cycles: 28,
    bgPosition: '0px 220px, 3px 220px, 151.5px 337.5px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 235px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 235px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 117.5px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 252,
    cycles: 54,
    bgPosition: '25px 24px, 28px 24px, 176.5px 150px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 252px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 252px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 126px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 150,
    cycles: 36,
    bgPosition: '50px 16px, 53px 16px, 201.5px 91px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 150px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 150px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 75px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 253,
    cycles: 67,
    bgPosition: '75px 224px, 78px 224px, 226.5px 230.5px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 253px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 253px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 126.5px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 204,
    cycles: 25,
    bgPosition: '100px 19px, 103px 19px, 251.5px 121px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 204px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 204px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 102px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 134,
    cycles: 62,
    bgPosition: '125px 120px, 128px 120px, 276.5px 187px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 134px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 134px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 67px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 179,
    cycles: 55,
    bgPosition: '150px 31px, 153px 31px, 301.5px 120.5px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 179px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 179px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 89.5px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 299,
    cycles: 44,
    bgPosition: '175px 235px, 178px 235px, 326.5px 384.5px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 299px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 299px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 149.5px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 215,
    cycles: 68,
    bgPosition: '200px 121px, 203px 121px, 351.5px 228.5px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 215px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 215px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 107.5px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 281,
    cycles: 66,
    bgPosition: '225px 224px, 228px 224px, 376.5px 364.5px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 281px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 281px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 140.5px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 158,
    cycles: 32,
    bgPosition: '250px 26px, 253px 26px, 401.5px 105px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 158px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 158px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 79px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
  {
    sizeY: 210,
    cycles: 30,
    bgPosition: '275px 75px, 278px 75px, 426.5px 180px',
    buildGradients: c =>
      [
        `radial-gradient(4px 100px at 0px 210px, ${c}, transparent)`,
        `radial-gradient(4px 100px at 300px 210px, ${c}, transparent)`,
        `radial-gradient(1.5px 1.5px at 150px 105px, ${c} 100%, transparent 150%)`,
      ].join(', '),
  },
] as const;

export function FallingPattern({
  color = 'var(--primary)',
  backgroundColor = 'var(--background)',
  duration = 150,
  blurIntensity = '1em',
  density = 1,
  className,
}: FallingPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const rawId = useId();
  const prefix = `fp-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const keyframeRules = ROWS.map(
    (row, i) =>
      `@keyframes ${prefix}-r${i} { from { transform: translate3d(0,0,0); } to { transform: translate3d(0,${row.sizeY}px,0); } }`
  ).join('\n');

  return (
    <div
      ref={containerRef}
      className={cn(className)}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      <style>{`${keyframeRules}
@media (prefers-reduced-motion: reduce) {
  [data-fp-prefix="${prefix}"] { animation: none !important; }
}`}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundColor,
        }}
      />

      {ROWS.map((row, i) => {
        const sizeTriplet = `300px ${row.sizeY}px, 300px ${row.sizeY}px, 300px ${row.sizeY}px`;
        return (
          <div
            key={i}
            data-fp-prefix={prefix}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `-${row.sizeY}px`,
              bottom: `-${row.sizeY}px`,
              zIndex: 0,
              backgroundImage: row.buildGradients(color),
              backgroundSize: sizeTriplet,
              backgroundPosition: row.bgPosition,
              backgroundRepeat: 'repeat',
              animation: `${prefix}-r${i} ${duration / row.cycles}s linear infinite`,
              animationPlayState: isVisible ? 'running' : 'paused',
            }}
          />
        );
      })}

      <div
        className={cn('dark:brightness-[600]')}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backdropFilter: `blur(${blurIntensity})`,
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, ${backgroundColor} 2px)`,
          backgroundSize: `${8 * density}px ${8 * density}px`,
        }}
      />
    </div>
  );
}

export default FallingPattern;
