/**
 * 8️⃣ + 9️⃣ IMAGE OPTIMIZATION + LAZY LOADING
 * Rasmlarni optimizatsiya qilish va lazy loading
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Lazy loaded image component with optimization
 */
export const LazyImage = ({ 
  src, 
  alt, 
  className = '',
  placeholder = '/images/placeholder.png',
  threshold = 0.1,
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    let observer;
    
    if (imageRef && !isInView) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold }
      );

      observer.observe(imageRef);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, isInView, threshold]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setImageSrc(placeholder);
        onError?.();
      };
    }
  }, [isInView, src, placeholder, onLoad, onError]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300`}
      loading="lazy"
    />
  );
};

/**
 * Optimized image with WebP support
 */
export const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes,
  quality = 80
}) => {
  // WebP support detection
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    const checkWebPSupport = () => {
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    };

    setSupportsWebP(checkWebPSupport());
  }, []);

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc) return '';
    
    const ext = supportsWebP ? 'webp' : 'jpg';
    const base = baseSrc.replace(/\.[^/.]+$/, '');
    
    return `
      ${base}-320w.${ext} 320w,
      ${base}-640w.${ext} 640w,
      ${base}-1024w.${ext} 1024w,
      ${base}-1920w.${ext} 1920w
    `.trim();
  };

  return (
    <picture>
      {supportsWebP && (
        <source
          type="image/webp"
          srcSet={generateSrcSet(src)}
          sizes={sizes || '100vw'}
        />
      )}
      <LazyImage
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    </picture>
  );
};

/**
 * Thumbnail image component
 */
export const ThumbnailImage = ({
  src,
  alt,
  size = 'small', // small, medium, large
  className = ''
}) => {
  const sizeMap = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  // Generate thumbnail URL
  const getThumbnailUrl = (originalSrc) => {
    if (!originalSrc) return '/images/placeholder.png';
    
    const base = originalSrc.replace(/\.[^/.]+$/, '');
    const ext = originalSrc.split('.').pop();
    
    return `${base}-thumb-${size}.${ext}`;
  };

  return (
    <LazyImage
      src={getThumbnailUrl(src)}
      alt={alt}
      className={`${sizeMap[size]} object-cover rounded ${className}`}
    />
  );
};

/**
 * Background image with lazy loading
 */
export const LazyBackgroundImage = ({
  src,
  children,
  className = '',
  placeholder = 'bg-gray-200'
}) => {
  const [bgImage, setBgImage] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setBgImage(src);
              setIsLoaded(true);
            };
            
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [src]);

  return (
    <div
      ref={elementRef}
      className={`${className} ${!isLoaded ? placeholder : ''} transition-all duration-300`}
      style={isLoaded ? { backgroundImage: `url(${bgImage})` } : {}}
    >
      {children}
    </div>
  );
};

export default LazyImage;

