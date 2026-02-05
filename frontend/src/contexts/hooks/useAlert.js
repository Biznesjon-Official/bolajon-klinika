import { useState } from 'react';

export const useAlert = () => {
  const [alertModal, setAlertModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' 
  });

  const showAlert = (message, type = 'info', title = '') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  return {
    alertModal,
    showAlert,
    closeAlert
  };
};

export const useConfirm = () => {
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null,
    type: 'warning',
    confirmText: 'Tasdiqlash',
    cancelText: 'Bekor qilish'
  });

  const showConfirm = (message, onConfirm, options = {}) => {
    setConfirmModal({ 
      isOpen: true, 
      title: options.title || 'Tasdiqlash',
      message, 
      onConfirm,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Tasdiqlash',
      cancelText: options.cancelText || 'Bekor qilish'
    });
  };

  const closeConfirm = () => {
    setConfirmModal({ 
      isOpen: false, 
      title: '', 
      message: '', 
      onConfirm: null,
      type: 'warning',
      confirmText: 'Tasdiqlash',
      cancelText: 'Bekor qilish'
    });
  };

  return {
    confirmModal,
    showConfirm,
    closeConfirm
  };
};
