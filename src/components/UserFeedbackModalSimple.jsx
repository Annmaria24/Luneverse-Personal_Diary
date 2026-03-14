import React, { useState } from 'react';
import { submitUserFeedback } from '../services/feedbackService';
import './Styles/UserFeedbackModal.css';

const UserFeedbackModalSimple = ({ isOpen, onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    message: '',
    rating: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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

    // More robust check for authentication and verification
    if (!currentUser) {
      setSubmitStatus({
        type: 'error',
        message: 'You must be logged in to submit feedback. Please sign in and try again.'
      });
      return;
    }

    if (!currentUser.emailVerified) {
      setSubmitStatus({
        type: 'error',
        message: 'Your email address needs to be verified before you can submit feedback. Please check your email and click the verification link, then refresh this page.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await submitUserFeedback(currentUser.uid, {
        ...formData,
        type: 'general',
        category: 'general',
        priority: 'medium'
      });

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your feedback! We appreciate your input and will review it shortly.'
        });

        // Reset form after successful submission
        setFormData({
          message: '',
          rating: null
        });

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);

      // Provide more specific error messages based on the error type
      let errorMessage = 'Sorry, there was an error submitting your feedback. Please try again.';

      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please make sure you are logged in with a verified email address.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please check your internet connection and try again.';
      } else if (error.code === 'failed-precondition') {
        errorMessage = 'Database operation failed. Please try again in a few moments.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setSubmitStatus({
        type: 'error',
        message: errorMessage
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
            <label htmlFor="message">Your Feedback:</label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Please share your thoughts, suggestions, or report any issues..."
              rows={6}
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

export default UserFeedbackModalSimple;
