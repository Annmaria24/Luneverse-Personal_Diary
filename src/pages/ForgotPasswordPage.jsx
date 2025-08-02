import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Styles/ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      });

      setEmailSent(true);
      setMessage(`Password reset email sent to ${email}. Please check your inbox (and spam folder) for the reset link.`);
      console.log("✅ Password reset email sent to:", email);

    } catch (error) {
      console.error("Password reset error:", error);
      
      switch (error.code) {
        case 'auth/user-not-found':
          setError("No account found with this email address. Please check your email or create a new account.");
          break;
        case 'auth/invalid-email':
          setError("Invalid email address. Please enter a valid email.");
          break;
        case 'auth/too-many-requests':
          setError("Too many password reset attempts. Please wait a few minutes before trying again.");
          break;
        default:
          setError("Failed to send password reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setMessage("");
    setError("");
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div className="forgot-password-page">
      {/* Background Elements */}
      <div className="forgot-password-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🔑</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🌸</div>
      </div>

      {/* Main Content */}
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="form-header">
            <Link to="/login" className="back-to-login">
              <span className="back-arrow">←</span>
              Back to Login
            </Link>
            
            <div className="header-icon">
              {emailSent ? "📧" : "🔑"}
            </div>
            
            <h1>{emailSent ? "Check Your Email" : "Reset Password"}</h1>
            <p>
              {emailSent 
                ? "We've sent password reset instructions to your email address."
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </p>
          </div>

          {!emailSent ? (
            <form className="forgot-password-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit" 
                className={`reset-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="success-content">
              {message && (
                <div className="success-message">
                  {message}
                </div>
              )}

              <div className="email-instructions">
                <div className="instruction-step">
                  <span className="step-number">1</span>
                  <span className="step-text">Check your email inbox</span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">2</span>
                  <span className="step-text">Look for email from Firebase (check spam folder)</span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">3</span>
                  <span className="step-text">Click the password reset link</span>
                </div>
                <div className="instruction-step">
                  <span className="step-number">4</span>
                  <span className="step-text">Create your new password</span>
                </div>
              </div>

              <div className="action-buttons">
                <button onClick={handleBackToLogin} className="back-button">
                  Back to Login
                </button>
                <button onClick={handleResendEmail} className="resend-button">
                  Resend Email
                </button>
              </div>
            </div>
          )}

          <div className="form-footer">
            <div className="help-text">
              <p>Remember your password? <Link to="/login" className="login-link">Sign in here</Link></p>
              <p>Don't have an account? <Link to="/signup" className="signup-link">Create one here</Link></p>
            </div>
            
            <div className="security-note">
              <span className="security-icon">🔒</span>
              Password reset links expire in 1 hour for security
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
