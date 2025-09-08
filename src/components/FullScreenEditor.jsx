import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import CustomModal from './CustomModal';
import LoadingSpinner from './LoadingSpinner';
import { useCustomModal } from '../hooks/useCustomModal';
import './Styles/FullScreenEditor.css';

const FullScreenEditor = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialContent = '', 
  initialMood = '',
  isEditing = false,
  placeholder = "Write about your day, your thoughts, your dreams... ✨"
}) => {
  const [content, setContent] = useState(initialContent);
  const [mood, setMood] = useState(initialMood);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  const { modalState, showModal, showConfirm, showAlert, showError, showSuccess } = useCustomModal();

  const moods = ['😊', '😌', '😐', '😔', '😢', '😤', '🥰', '😴', '🤗', '😰', '🥳', '😎'];

  useEffect(() => {
    setContent(initialContent);
    setMood(initialMood);
  }, [initialContent, initialMood, isOpen]);

  useEffect(() => {
    // Calculate word count
    const text = content.replace(/<[^>]*>/g, '').trim();
    const words = text ? text.split(/\s+/).length : 0;
    setWordCount(words);
  }, [content]);

  useEffect(() => {
    // Handle escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSave = async () => {
    if (!content.trim() && !mood) {
      await showAlert('Please write something or select a mood before saving.', 'Missing Content');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ content, mood });
      // Close directly without checking for unsaved changes since we just saved
      onClose();
    } catch (error) {
      console.error('Error saving entry:', error);
      await showError('Failed to save entry. Please try again.', 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    if (content !== initialContent || mood !== initialMood) {
      const confirmClose = await showModal({
        type: 'confirm',
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to close without saving?',
        confirmText: 'Close Without Saving',
        cancelText: 'Keep Editing'
      });
      if (!confirmClose) return;
    }
    onClose();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fullscreen-editor-overlay ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="fullscreen-editor">
        {/* Header */}
        <div className="editor-header">
          <div className="header-left">
            <div className="editor-title">
              <h2>{isEditing ? 'Edit Entry' : 'New Entry'}</h2>
              <span className="current-datetime">{getCurrentDateTime()}</span>
            </div>
          </div>
          
          <div className="header-center">
            <div className="mood-selector-fullscreen">
              <span className="mood-label">Today's mood:</span>
              {moods.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setMood(emoji)}
                  className={`mood-btn-fullscreen ${mood === emoji ? 'selected' : ''}`}
                  title={`Select ${emoji} mood`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="header-right">
            <div className="editor-controls">
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <div className="word-count">
                <span>{wordCount} words</span>
                <span>{content.replace(/<[^>]*>/g, '').length} characters</span>
              </div>
              
              <button
                onClick={handleClose}
                className="close-btn"
                title="Close Editor (Esc)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="editor-content-area">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={placeholder}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Footer */}
        <div className="editor-footer">
          <div className="footer-left">
            <div className="save-status">
              {isSaving && (
                <div className="saving-indicator">
                  <LoadingSpinner 
                    size="small" 
                    message="Saving..." 
                    showMessage={true}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="footer-right">
            <button
              onClick={handleClose}
              className="cancel-btn"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="save-btn"
              disabled={isSaving || (!content.trim() && !mood)}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={modalState.onCancel}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
    </div>
  );
};

export default FullScreenEditor;