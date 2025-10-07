import React, { useState } from 'react';
import { submitUserFeedback } from '../services/feedbackService';
import './Styles/UserFeedbackModal.css';

const UserFeedbackModal = ({ isOpen, onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: null,
    category: 'general',
    priority: 'medium',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const feedbackTypes = [
    { value: 'general', label: 'General Feedback', icon: '💬' },
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'feature', label: 'Feature Request', icon: '✨' },
    { value: 'improvement', label: 'Improvement', icon: '📈' },
    { value: 'question', label: 'Question', icon: '❓' }
  ];

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'ui', label: 'User Interface' },
    { value: 'functionality', label: 'Functionality' },
    { value: 'performance', label: 'Performance' },
    { value: 'usability', label: 'Usability' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'mobile', label: 'Mobile Experience' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please enter your feedback message.' });
      return;
    }

    if (!currentUser) {
      setSubmitStatus({ type: 'error', message: 'You must be logged in to submit feedback.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await submitUserFeedback(currentUser.uid, formData);

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your feedback! We appreciate your input and will review it shortly.'
        });

        // Reset form after successful submission
        setFormData({
          type: 'general',
          subject: '',
          message: '',
          rating: null,
          category: 'general',
          priority: 'medium',
          tags: []
        });

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Sorry, there was an error submitting your feedback. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="rating-container">
        <label>Rate your experience (optional):</label>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star ${formData.rating >= star ? 'active' : ''}`}
              onClick={() => handleInputChange('rating', star)}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h2>Share Your Feedback</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label>Feedback Type:</label>
            <div className="feedback-types">
              {feedbackTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-button ${formData.type === type.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief summary of your feedback..."
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority:</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Your Feedback:</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Please provide detailed feedback..."
              rows={5}
              required
            />
          </div>

          {renderStars()}

          {submitStatus && (
            <div className={`submit-status ${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFeedbackModal;
