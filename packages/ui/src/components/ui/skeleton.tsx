import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否显示动画 */
  animated?: boolean;
  /** 变体类型 */
  variant?: 'default' | 'circular' | 'rounded' | 'text';
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      animated = true,
      variant = 'default',
      width,
      height,
      style,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'rounded-md',
      circular: 'rounded-full',
      rounded: 'rounded-lg',
      text: 'rounded h-4 w-full',
    };

    const computedStyle: React.CSSProperties = {
      ...style,
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && {
        height: typeof height === 'number' ? `${height}px` : height,
      }),
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-200 dark:bg-gray-700',
          variantStyles[variant],
          animated && 'animate-pulse',
          className
        )}
        style={computedStyle}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// 预设骨架屏组件
export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否显示图片 */
  showImage?: boolean;
  /** 文本行数 */
  lines?: number;
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    { className, showAvatar = true, showImage = true, lines = 3, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'p-4 space-y-4 rounded-lg border border-gray-200 dark:border-gray-700',
          className
        )}
        {...props}
      >
        {showImage && <Skeleton className="w-full h-48" variant="rounded" />}

        <div className="space-y-3">
          {showAvatar && (
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10" variant="circular" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          )}

          <Skeleton className="h-5 w-3/4" />

          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-3"
                style={{ width: i === lines - 1 ? '60%' : '100%' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

// 列表骨架屏
export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 列表项数量 */
  count?: number;
  /** 是否显示头像 */
  showAvatar?: boolean;
}

const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ className, count = 5, showAvatar = true, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            {showAvatar && (
              <Skeleton className="w-12 h-12" variant="circular" />
            )}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
);

SkeletonList.displayName = 'SkeletonList';

// 表格骨架屏
export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 行数 */
  rows?: number;
  /** 列数 */
  columns?: number;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ className, rows = 5, columns = 4, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        {/* 表头 */}
        <div className="flex space-x-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* 表体 */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 py-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }
);

SkeletonTable.displayName = 'SkeletonTable';

// 文章详情骨架屏
const SkeletonArticle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('space-y-6', className)} {...props}>
      {/* 标题 */}
      <Skeleton className="h-8 w-3/4" />

      {/* 元信息 */}
      <div className="flex items-center space-x-4">
        <Skeleton className="w-10 h-10" variant="circular" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* 封面图 */}
      <Skeleton className="w-full h-64" variant="rounded" />

      {/* 正文 */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
});

SkeletonArticle.displayName = 'SkeletonArticle';

export { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonArticle };
