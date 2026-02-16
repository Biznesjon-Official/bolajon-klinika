import { createPortal } from 'react-dom';
import { useEffect } from 'react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, showCancel = false, confirmText = 'OK', cancelText = 'Bekor qilish' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-500',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: 'check_circle',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: 'error',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: 'warning',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-500',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: 'info',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${config.bgColor} border-l-4 ${config.borderColor} rounded-t-2xl p-6`}>
          <div className="flex items-center gap-4">
            <div className={`size-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-3xl ${config.iconColor}`}>
                {config.icon}
              </span>
            </div>
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {title}
                </h3>
              )}
              <p className="text-gray-700 dark:text-gray-300">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {showCancel ? (
            // 2 ta tugma - OK va Bekor qilish
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className={`flex-1 px-6 py-3 ${config.buttonColor} text-white rounded-xl font-semibold transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            // Faqat OK tugmasi
            <button
              onClick={onClose}
              className={`w-full px-6 py-3 ${config.buttonColor} text-white rounded-xl font-semibold transition-colors`}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AlertModal;

