import React, { useState, useEffect } from 'react';
import './Styles/CustomModal.css';

const LinkInputModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Insert Link',
  initialUrl = '',
  initialText = ''
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
    }
  }, [isOpen, initialUrl, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onConfirm({ url: url.trim(), text: text.trim() || url.trim() });
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
    }
  };

  useEffect(() => {
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
      <div className="custom-modal modal-confirm">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div className="modal-icon">🔗</div>
            <h3 className="modal-title">{title}</h3>
          </div>
          
          <div className="modal-body">
            <div className="link-input-group">
              <label htmlFor="link-url" className="link-input-label">
                URL *
              </label>
              <input
                id="link-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="link-input"
                autoFocus
                required
              />
            </div>
            
            <div className="link-input-group">
              <label htmlFor="link-text" className="link-input-label">
                Display Text (optional)
              </label>
              <input
                id="link-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Link text (will use URL if empty)"
                className="link-input"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button"
              className="modal-btn modal-btn-cancel" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="modal-btn modal-btn-confirm"
              disabled={!url.trim()}
            >
              Insert Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkInputModal;