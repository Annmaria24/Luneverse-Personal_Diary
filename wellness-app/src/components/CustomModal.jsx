import React from 'react';
import './Styles/CustomModal.css';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'confirm', // 'confirm', 'alert', 'error', 'success'
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '⚠️';
      case 'success':
        return '✅';
      case 'alert':
        return '💡';
      case 'confirm':
      default:
        return '❓';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'error':
        return 'modal-error';
      case 'success':
        return 'modal-success';
      case 'alert':
        return 'modal-alert';
      case 'confirm':
      default:
        return 'modal-confirm';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && onConfirm) {
      onConfirm();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="custom-modal-overlay" onClick={handleBackdropClick}>
      <div className={`custom-modal ${getTypeClass()}`}>
        <div className="modal-header">
          <div className="modal-icon">{getIcon()}</div>
          <h3 className="modal-title">{title}</h3>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          {showCancel && (
            <button 
              className="modal-btn modal-btn-cancel" 
              onClick={onClose}
              autoFocus={type === 'confirm'}
            >
              {cancelText}
            </button>
          )}
          <button 
            className="modal-btn modal-btn-confirm" 
            onClick={onConfirm || onClose}
            autoFocus={type !== 'confirm'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;