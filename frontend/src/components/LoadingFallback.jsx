/**
 * OPTIMIZED LOADING FALLBACK
 * Minimal va tez yuklanadigan loading component
 */

export default function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
      </div>
    </div>
  );
}

/**
 * SKELETON LOADER - Instant feedback
 */
export function SkeletonLoader() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

/**
 * TABLE SKELETON
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        </div>
      ))}
    </div>
  );
}

