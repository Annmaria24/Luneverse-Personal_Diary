import React from 'react';
import './Styles/LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  showMessage = true,
  color = 'purple' 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'spinner-small';
      case 'large':
        return 'spinner-large';
      case 'medium':
      default:
        return 'spinner-medium';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'white':
        return 'spinner-white';
      case 'purple':
      default:
        return 'spinner-purple';
    }
  };

  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${getSizeClass()} ${getColorClass()}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {showMessage && (
        <p className="spinner-message">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;