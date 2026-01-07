import * as React from 'react';
import { cn } from '@/lib/utils';
import DefaultAvatar from './DefaultAvatar';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  fallback?: React.ReactNode;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  username?: string;
  variant?: 'simple' | 'modern' | 'gradient' | 'minimal';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 40, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    />
  )
);
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, fallback, onError, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);
    const [, setIsLoading] = React.useState(!!src);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setHasError(true);
      setIsLoading(false);
      onError?.(e);
    };

    const handleLoad = () => {
      setIsLoading(false);
    };

    // 如果没有 src 或者加载失败，显示 fallback
    if (!src || hasError) {
      return fallback || null;
    }

    return (
      <img
        ref={ref}
        src={src}
        className={cn('aspect-square h-full w-full object-cover', className)}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, username, variant = 'simple', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        className
      )}
      {...props}
    >
      <DefaultAvatar size={40} variant={variant} username={username} />
    </div>
  )
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
