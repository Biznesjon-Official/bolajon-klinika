import toast from 'react-hot-toast';

/**
 * Enhanced toast notifications with icons and actions
 */

const toastConfig = {
  duration: 4000,
  position: 'top-right',
  style: {
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
  },
};

export const showToast = {
  // Success toast with icon
  success: (message, options = {}) => {
    return toast.success(message, {
      ...toastConfig,
      icon: '✅',
      style: {
        ...toastConfig.style,
        background: '#10B981',
        color: '#fff',
      },
      ...options,
    });
  },

  // Error toast with icon
  error: (message, options = {}) => {
    return toast.error(message, {
      ...toastConfig,
      icon: '❌',
      duration: 6000,
      style: {
        ...toastConfig.style,
        background: '#EF4444',
        color: '#fff',
      },
      ...options,
    });
  },

  // Warning toast
  warning: (message, options = {}) => {
    return toast(message, {
      ...toastConfig,
      icon: '⚠️',
      style: {
        ...toastConfig.style,
        background: '#F59E0B',
        color: '#fff',
      },
      ...options,
    });
  },

  // Info toast
  info: (message, options = {}) => {
    return toast(message, {
      ...toastConfig,
      icon: 'ℹ️',
      style: {
        ...toastConfig.style,
        background: '#3B82F6',
        color: '#fff',
      },
      ...options,
    });
  },

  // Loading toast
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...toastConfig,
      ...options,
    });
  },

  // Promise toast (auto success/error)
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Yuklanmoqda...',
        success: messages.success || 'Muvaffaqiyatli!',
        error: messages.error || 'Xatolik yuz berdi',
      },
      {
        ...toastConfig,
        ...options,
      }
    );
  },

  // Custom toast with action button
  withAction: (message, actionText, onAction, options = {}) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700`}
        >
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
          </div>
          <button
            onClick={() => {
              onAction();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {actionText}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ),
      {
        duration: 10000,
        ...options,
      }
    );
  },

  // Undo toast
  undo: (message, onUndo, options = {}) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-gray-900 dark:bg-gray-800 shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4`}
        >
          <span className="text-2xl">↩️</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{message}</p>
          </div>
          <button
            onClick={() => {
              onUndo();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1.5 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Bekor qilish
          </button>
        </div>
      ),
      {
        duration: 5000,
        ...options,
      }
    );
  },

  // Dismiss specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

export default showToast;
