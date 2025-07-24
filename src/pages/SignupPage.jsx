import { useState } from "react";
import { Link } from "react-router-dom";
import "./Styles/SignUpPage.css";
import { auth } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Enhanced password validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!/(?=.*[0-9])/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      setError("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?).");
      return;
    }

    try {
      // STEP 1: Create user account (this creates Firebase Auth user)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("🔐 Firebase Auth user created:", user.email);
      console.log("📧 Email verified status:", user.emailVerified);

      // STEP 2: Send email verification BEFORE allowing any database access
      try {
        console.log("📤 Sending verification email to:", user.email);

        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-success`,
          handleCodeInApp: false
        });

        console.log("✅ Verification email sent successfully");

        // IMPORTANT: Sign out the user immediately after creating account
        // This prevents them from accessing the app until email is verified
        await signOut(auth);
        console.log("🚪 User signed out - must verify email first");

        // Show success message without alert
        console.log("✅ Account created and verification email sent to:", user.email);

        // Store email for verification tracking
        localStorage.setItem('pendingVerificationEmail', user.email);
        navigate("/verify-email");

      } catch (emailError) {
        console.error("❌ Email verification failed:", emailError);

        // If email verification fails, delete the created user account
        try {
          await user.delete();
          console.log("🗑️ Deleted unverified user account");
        } catch (deleteError) {
          console.error("Failed to delete user:", deleteError);
        }

        setError("Failed to send verification email. Please try again.");
      }

    } catch (error) {
      console.error("Signup error:", error);
      setError("Signup failed: " + error.message);
    }
  };

  return (
    <div className="signup-page">
      {/* Background Elements */}
      <div className="signup-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
      </div>

      {/* Main Content */}
      <div className="signup-container">
        {/* Left Side - Signup Form */}
        <div className="signup-form-section">
          <div className="form-header">
            <Link to="/" className="back-to-home">
              <span className="back-arrow">←</span>
              Back to Home
            </Link>
            <h2>Create Account</h2>
            <p>Join thousands of women taking control of their wellness</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (6+ chars, 1 number, 1 special char)"
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

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="form-agreement">
              <label className="agreement-checkbox">
                <input type="checkbox" required />
                <span className="checkmark"></span>
                I agree to the <Link to="/terms" className="terms-link">Terms of Service</Link> and <Link to="/privacy" className="privacy-link">Privacy Policy</Link>
              </label>
            </div>

            <button type="submit" className="signup-button">
              Create Your Luneverse Account
            </button>
          </form>

          <div className="form-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="login-link">
                Sign in here
              </Link>
            </p>
            <div className="privacy-note">
              <span className="privacy-icon">🔒</span>
              Your data is encrypted and completely private
            </div>

          </div>
        </div>

        {/* Right Side - Welcome Message */}
        <div className="signup-welcome">
          <div className="welcome-content">
            <h1>Welcome to Your Wellness Journey</h1>
            <p>Join thousands of women discovering their inner strength</p>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon">🌸</span>
                <span>Track Your Cycle</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💭</span>
                <span>Journal Your Thoughts</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📈</span>
                <span>Monitor Your Mood</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌙</span>
                <span>Find Your Balance</span>
              </div>
            </div>
            <div className="welcome-quote">
              <p>"Every journey begins with a single step towards self-discovery"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
