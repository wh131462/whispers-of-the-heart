import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  className?: string;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  fallback,
  className,
  onError,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && fallback) {
      setImgSrc(fallback);
      setHasError(true);
    }
    onError?.(e);
  };

  return (
    <img
      src={imgSrc || fallback}
      alt={alt}
      className={cn('object-cover', className)}
      onError={handleError}
      {...props}
    />
  );
};

export { Image };
