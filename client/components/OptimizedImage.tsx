import { useState, useRef, useEffect, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  fallbackSrc = "https://via.placeholder.com/120x120/e5e7eb/9ca3af?text=No+Image",
  placeholder,
  onError,
  loading = 'lazy'
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Preload image
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
    onError?.(e);
  };

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-200 dark:bg-gray-600 flex items-center justify-center animate-pulse`}>
        {placeholder ? (
          <span className="text-gray-500 text-xs text-center">{placeholder}</span>
        ) : (
          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc || fallbackSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      decoding="async"
    />
  );
});

export default OptimizedImage;