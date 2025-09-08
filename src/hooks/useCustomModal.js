import { useState, useCallback } from 'react';

export const useCustomModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: true,
    onConfirm: null,
    onCancel: null
  });

  const showModal = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'Confirm',
        message: options.message || '',
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        showCancel: options.showCancel !== false,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Convenience methods
  const showConfirm = useCallback((message, title = 'Confirm') => {
    return showModal({
      type: 'confirm',
      title,
      message,
      confirmText: 'Yes',
      cancelText: 'No'
    });
  }, [showModal]);

  const showAlert = useCallback((message, title = 'Notice') => {
    return showModal({
      type: 'alert',
      title,
      message,
      showCancel: false,
      confirmText: 'OK'
    });
  }, [showModal]);

  const showError = useCallback((message, title = 'Error') => {
    return showModal({
      type: 'error',
      title,
      message,
      showCancel: false,
      confirmText: 'OK'
    });
  }, [showModal]);

  const showSuccess = useCallback((message, title = 'Success') => {
    return showModal({
      type: 'success',
      title,
      message,
      showCancel: false,
      confirmText: 'OK'
    });
  }, [showModal]);

  return {
    modalState,
    showModal,
    hideModal,
    showConfirm,
    showAlert,
    showError,
    showSuccess
  };
};