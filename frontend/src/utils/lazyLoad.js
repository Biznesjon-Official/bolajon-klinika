/**
 * 9️⃣ LAZY LOADING UTILITIES
 * React.lazy va Suspense uchun helper functions
 */

import { lazy, Suspense } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';

/**
 * Lazy load component with retry logic
 */
export const lazyWithRetry = (componentImport, retries = 3, interval = 1000) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (retriesLeft) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }

            console.log(`Retrying import... (${retriesLeft} attempts left)`);
            setTimeout(() => {
              attemptImport(retriesLeft - 1);
            }, interval);
          });
      };

      attemptImport(retries);
    });
  });
};

/**
 * Lazy load with preload
 */
export const lazyWithPreload = (componentImport) => {
  const LazyComponent = lazy(componentImport);
  LazyComponent.preload = componentImport;
  return LazyComponent;
};

/**
 * Lazy wrapper with custom loading
 */
export const LazyWrapper = ({ 
  children, 
  fallback = <LoadingSkeleton type="card" count={3} />,
  errorFallback = <div className="p-4 text-center text-red-600">Xatolik yuz berdi</div>
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

/**
 * Route-based code splitting helper
 */
export const createLazyRoute = (path, componentImport, options = {}) => {
  const {
    preload = false,
    fallback = <LoadingSkeleton type="page" />,
    retry = true
  } = options;

  const Component = retry 
    ? lazyWithRetry(componentImport)
    : lazy(componentImport);

  if (preload) {
    Component.preload = componentImport;
  }

  return {
    path,
    element: (
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    ),
    Component
  };
};

/**
 * Preload routes on hover
 */
export const preloadOnHover = (componentImport) => {
  let preloaded = false;

  return {
    onMouseEnter: () => {
      if (!preloaded) {
        componentImport();
        preloaded = true;
      }
    },
    onFocus: () => {
      if (!preloaded) {
        componentImport();
        preloaded = true;
      }
    }
  };
};

/**
 * Preload routes on idle
 */
export const preloadOnIdle = (componentImports, timeout = 2000) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      componentImports.forEach(importFn => importFn());
    }, { timeout });
  } else {
    setTimeout(() => {
      componentImports.forEach(importFn => importFn());
    }, timeout);
  }
};

/**
 * Lazy load modal
 */
export const LazyModal = ({ isOpen, componentImport, ...props }) => {
  if (!isOpen) return null;

  const ModalComponent = lazy(componentImport);

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
      <ModalComponent {...props} />
    </Suspense>
  );
};

/**
 * Lazy load tab content
 */
export const LazyTab = ({ isActive, componentImport, ...props }) => {
  if (!isActive) return null;

  const TabComponent = lazy(componentImport);

  return (
    <Suspense fallback={<LoadingSkeleton type="card" count={2} />}>
      <TabComponent {...props} />
    </Suspense>
  );
};

export default {
  lazyWithRetry,
  lazyWithPreload,
  LazyWrapper,
  createLazyRoute,
  preloadOnHover,
  preloadOnIdle,
  LazyModal,
  LazyTab
};
