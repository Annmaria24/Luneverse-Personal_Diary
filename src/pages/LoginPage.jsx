import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { createUserProfile, updateLastLogin } from "../services/userService";
import CustomModal from "../components/CustomModal";
import { useModal } from "../hooks/useModal";
import { getErrorMessage } from "../utils/errorMessages";
import "./Styles/LoginPage.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { modalState, hideModal, showError, showAlert } = useModal();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [location]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await createUserProfile(user);
      await updateLastLogin(user.uid);

      const isNewUser = user?.metadata?.creationTime === user?.metadata?.lastSignInTime;
      if (isNewUser) {
        navigate("/set-password");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Google Sign-in error:", error);
      const userFriendlyMessage = getErrorMessage(error);
      showError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showAlert("Please verify your email before logging in.", "Email Verification Required");
        await signOut(auth);
        return;
      }

      await createUserProfile(user);
      await updateLastLogin(user.uid);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      const userFriendlyMessage = getErrorMessage(error);
      showError(userFriendlyMessage);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
      </div>

      <div className="login-container">
        <div className="login-welcome">
          <div className="welcome-content">
            <h1>Welcome Back</h1>
            <p>Continue your wellness journey with Luneverse</p>
            <div className="welcome-features">
              <div className="feature-item">📝 Private Journaling</div>
              <div className="feature-item">📊 Mood Tracking</div>
              <div className="feature-item">🌸 Cycle Insights</div>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <Link to="/" className="back-to-home">
            ← Back to Home
          </Link>

          <div className="form-content-wrapper">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to access your personal sanctuary</p>
            </div>

            {successMessage && <div className="success-message">{successMessage}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button type="submit" className="login-button">Sign In to Luneverse</button>
            </form>

            <div className="alternative-login">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="google-login-btn"
                disabled={loading}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google Logo"
                />
                {loading ? "Signing in..." : "Sign in with Google"}
              </button>
            </div>

            <hr className="divider" />

            <div className="form-footer">
              <p>
                Don't have an account? <Link to="/signup">Sign up here</Link>
              </p>
              <div className="privacy-note">
                🔒 Your data is encrypted and completely private
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
    </div>
  );
}

export default LoginPage;
