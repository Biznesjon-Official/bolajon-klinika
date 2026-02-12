const StatCard = ({ title, value, icon, trend, trendValue, subtitle, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-green-50 dark:bg-green-900/20 text-primary',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    warning: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    info: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 sm:p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm sm:text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-1 truncate">{title}</p>
          <h3 className="text-2xl sm:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 break-words">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-xs sm:text-sm sm:text-sm sm:text-base ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <span className="material-symbols-outlined text-sm sm:text-sm sm:text-base">
                {trend === 'up' ? 'trending_up' : 'trending_down'}
              </span>
              <span className="font-semibold">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`size-10 sm:size-12 rounded-lg sm:rounded-lg sm:rounded-xl ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
          <span className="material-symbols-outlined text-xl sm:text-xl sm:text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
