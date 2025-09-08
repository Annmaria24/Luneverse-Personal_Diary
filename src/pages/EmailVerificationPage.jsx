import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { applyActionCode } from "firebase/auth";
import { useLocation } from "react-router-dom";

import { 
  onAuthStateChanged, 
  sendEmailVerification, 
  signOut,
  reload 
} from "firebase/auth";
import "./Styles/EmailVerificationPage.css";
import Loader from "./Loading";

function EmailVerificationPage() {
  const [user, setUser] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check for pending verification email in localStorage
    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    if (pendingEmail) {
      setUserEmail(pendingEmail);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserEmail(currentUser.email);
        // If user is already verified, redirect to dashboard
        if (currentUser.emailVerified) {
          // Clear pending verification email
          localStorage.removeItem('pendingVerificationEmail');
          navigate("/dashboard");
        }
      } else {
        // If no user and no pending email, redirect to signup
        if (!pendingEmail) {
          navigate("/signup");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Check verification status
  const handleCheckVerification = async () => {
    setIsChecking(true);
    setMessage("");

    try {
      if (!user) {
        // User is signed out (which is expected after signup)
        // Direct them to try logging in to check if verification worked
        setMessage("🔑 Please try logging in with your email and password to check if verification was successful.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }

      // If user is still signed in, check their verification status
      await reload(user);

      if (user.emailVerified) {
        setMessage("✅ Email verified successfully! Redirecting to login...");
        localStorage.removeItem('pendingVerificationEmail');

        // Sign out and redirect to login
        await signOut(auth);

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage("❌ Email not yet verified. Please check your inbox and click the verification link.");
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setMessage("❌ Error checking verification. Please try logging in to see if verification was successful.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } finally {
      setIsChecking(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!user && !userEmail) {
      setMessage("Unable to resend verification email. Please try signing up again.");
      return;
    }

    setIsResending(true);
    setMessage("");

    try {
      if (user) {
        // User is signed in, send verification directly
        await sendEmailVerification(user, {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false
        });
      } else {
        // User is not signed in, redirect to signup to recreate account
        setMessage("Please sign up again to receive a new verification email.");
        setTimeout(() => {
          localStorage.removeItem('pendingVerificationEmail');
          navigate("/signup");
        }, 2000);
        return;
      }
      
      setMessage("Verification email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error sending verification email:", error);
      if (error.code === "auth/too-many-requests") {
        setMessage("Too many requests. Please wait before requesting another verification email.");
      } else {
        setMessage("Failed to send verification email. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('pendingVerificationEmail');
      navigate("/signup");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user && !userEmail) {
    return <Loader />;
  }

  return (
    <div className="verification-page">
      {/* Background Elements */}
      <div className="verification-background">
        <div className="floating-element element-1">📧</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
      </div>

      {/* Main Content */}
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <div className="verification-icon">📧</div>
            <h1>Verify Your Email</h1>
            <p>We've sent a verification link to:</p>
            <div className="email-display">{userEmail}</div>
          </div>

          <div className="verification-content">
            <div className="verification-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span className="step-text">Check your SPAM/JUNK folder first!</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span className="step-text">Look for email from: noreply@luneverse.firebaseapp.com</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span className="step-text">Click the verification link</span>
              </div>
              <div className="step">
                <span className="step-number">4</span>
                <span className="step-text">Return here and check status</span>
              </div>
            </div>

            <div className="spam-warning">
              <div className="spam-icon">⚠️</div>
              <div className="spam-text">
                <strong>Email in Spam?</strong> Mark it as "Not Spam" to receive future emails in your inbox.
              </div>
            </div>

            {message && (
              <div className={`message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="verification-actions">
              <button
                onClick={handleCheckVerification}
                className={`check-button ${isChecking ? 'loading' : ''}`}
                disabled={isChecking}
              >
                {isChecking ? "Checking..." : "Check Verification Status"}
              </button>

              <button
                onClick={handleResendVerification}
                className={`resend-button ${isResending ? 'loading' : ''}`}
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>

            <div className="verification-footer">
              <p>
                <button onClick={handleLogout} className="logout-link">
                  Sign up with a different email
                </button>
              </p>
              <div className="help-text">
                <p>Didn't receive the email? Check your spam folder or try resending.</p>
                <p><strong>After clicking the verification link in your email:</strong> Come back here and click "Check Verification Status" or try logging in directly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
