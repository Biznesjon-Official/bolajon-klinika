import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true,
  closeOnBackdrop = true 
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden sm:block';
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

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    xs: 'max-w-xs sm:max-w-sm',
    sm: 'max-w-sm sm:max-w-sm sm:max-w-md',
    md: 'max-w-sm sm:max-w-md sm:max-w-md sm:max-w-lg',
    lg: 'max-w-md sm:max-w-lg sm:max-w-xl sm:max-w-2xl',
    xl: 'max-w-xl sm:max-w-2xl sm:max-w-2xl sm:max-w-4xl',
    '2xl': 'max-w-2xl sm:max-w-4xl sm:max-w-4xl sm:max-w-6xl',
    full: 'max-w-full sm:max-w-7xl'
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="modal-backdrop fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-3 sm:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden sm:block="true"></div>

      {/* Modal Content - Slide up on mobile, scale on desktop */}
      <div 
        className={`
          modal-content
          relative bg-white dark:bg-gray-900 
          w-full ${sizeClasses[size]} 
          max-h-[95vh] sm:max-h-[90vh] 
          flex flex-col
          rounded-t-2xl sm:rounded-xl sm:rounded-2xl
          shadow-2xl
          animate-slideUp sm:animate-scaleIn
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-2 sm:py-3 sm:py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            {title && (
              <h2 
                id="modal-title"
                className="text-lg sm:text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate pr-2"
              >
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg sm:rounded-lg sm:rounded-xl transition-colors ml-auto flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={t('common.close') || 'Close'}
                type="button"
              >
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-xl sm:text-xl sm:text-2xl">close</span>
              </button>
            )}
          </div>
        )}

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 sm:px-4 sm:px-6 lg:px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sm:py-4 sm:py-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
