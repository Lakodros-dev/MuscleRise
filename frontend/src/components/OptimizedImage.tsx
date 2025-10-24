import { useState, useRef, useEffect, memo, useCallback } from 'react'; 
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
  quality?: number;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  fallbackSrc = "https://via.placeholder.com/120x120/e5e7eb/9ca3af?text=No+Image",
  placeholder,
  onError,
  loading = 'lazy',
  width,
  height,
  quality = 80
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const imageCache = useRef<Map<string, string>>(new Map());

  // Optimize image URL with quality and dimensions
  const optimizeImageUrl = useCallback((url: string): string => {
    if (!url || url.includes('placeholder')) return url;

    // For external images, try to add optimization parameters
    try {
      const urlObj = new URL(url);

      // Add quality parameter if supported
      if (quality && quality < 100) {
        urlObj.searchParams.set('q', quality.toString());
      }

      // Add dimensions if provided
      if (width) urlObj.searchParams.set('w', width.toString());
      if (height) urlObj.searchParams.set('h', height.toString());

      return urlObj.toString();
    } catch {
      return url;
    }
  }, [quality, width, height]);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = src;
    if (imageCache.current.has(cacheKey)) {
      setImageSrc(imageCache.current.get(cacheKey)!);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const optimizedSrc = optimizeImageUrl(src);

    // Preload image
    const img = new Image();
    img.onload = () => {
      imageCache.current.set(cacheKey, optimizedSrc);
      setImageSrc(optimizedSrc);
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = optimizedSrc;
  }, [src, optimizeImageUrl]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
    onError?.(e);
  }, [hasError, fallbackSrc, onError]);

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
      width={width}
      height={height}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        objectFit: 'cover'
      }}
    />
  );
});

export default OptimizedImage;