import { useState } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false
  });

  const showModal = ({
    title = '',
    message,
    type = 'info',
    onConfirm = null,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText,
      showCancel
    });
  };

  const hideModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Convenience methods for different types of modals
  const showAlert = (message, title = 'Luneverse') => {
    showModal({
      title,
      message,
      type: 'info',
      confirmText: 'OK'
    });
  };

  const showSuccess = (message, title = 'Success') => {
    showModal({
      title,
      message,
      type: 'success',
      confirmText: 'OK'
    });
  };

  const showError = (message, title = 'Error') => {
    showModal({
      title,
      message,
      type: 'error',
      confirmText: 'OK'
    });
  };

  const showWarning = (message, title = 'Warning') => {
    showModal({
      title,
      message,
      type: 'warning',
      confirmText: 'OK'
    });
  };

  const showConfirm = (message, onConfirm, title = 'Confirm Action') => {
    showModal({
      title,
      message,
      type: 'confirm',
      onConfirm,
      confirmText: 'Yes',
      cancelText: 'No',
      showCancel: true
    });
  };

  return {
    modalState,
    showModal,
    hideModal,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm
  };
};
