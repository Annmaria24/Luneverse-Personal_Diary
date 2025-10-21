import React from 'react';
import './Styles/Toast.css';

const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    return `toast toast-${toast.type}`;
  };

  return (
    <div className={getTypeClass()}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{toast.message}</span>
        <button 
          className="toast-close" 
          onClick={() => onRemove(toast.id)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;

