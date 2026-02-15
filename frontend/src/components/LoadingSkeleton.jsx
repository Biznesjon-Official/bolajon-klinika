// Universal Loading Skeleton Component
export default function LoadingSkeleton({ type = 'card', count = 1, className = '' }) {
  const skeletons = {
    // Card skeleton
    card: (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    ),

    // Table row skeleton
    table: (
      <tr className={className}>
        <td className="px-4 py-3">
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </td>
        <td className="px-4 py-3">
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </td>
        <td className="px-4 py-3">
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </td>
      </tr>
    ),

    // List item skeleton
    list: (
      <div className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse flex items-center gap-4 w-full">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    ),

    // Text skeleton
    text: (
      <div className={`animate-pulse space-y-2 ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    ),

    // Stats card skeleton
    stats: (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </div>
    ),

    // Form skeleton
    form: (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  };

  const SkeletonComponent = skeletons[type] || skeletons.card;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{SkeletonComponent}</div>
      ))}
    </>
  );
}

