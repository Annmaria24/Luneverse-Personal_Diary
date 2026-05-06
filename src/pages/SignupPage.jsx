import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Styles/SignUpPage.css";
import { auth, googleProvider } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import { createUserProfile, updateLastLogin } from "../services/userService";
import { getErrorMessage } from "../utils/errorMessages";

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ GOOGLE SIGN-UP FUNCTION
  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("✅ Google Sign-up successful:", user.email);

      // ✅ Create or update Firestore profile
      await createUserProfile(
  {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
  },
  true // ✅ explicitly says it's a Google signup
);


      await updateLastLogin(user.uid);

      // ✅ If first-time user → go to Set Password page
      const isNewUser = user?.metadata?.creationTime === user?.metadata?.lastSignInTime;
      if (isNewUser) {
        navigate("/set-password");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("❌ Google Sign-up error:", error);
      const userFriendlyMessage = getErrorMessage(error);
      setError(userFriendlyMessage);
    }
  };

  // ✅ EMAIL + PASSWORD SIGN-UP FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (!/(?=.*[0-9])/.test(password)) {
      setError("Password must contain at least one number.");
      setIsLoading(false);
      return;
    }

    // Check for at least one non-alphanumeric character (special char)
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Create profile immediately with gender
      await createUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: "",
        photoURL: "",
        gender: gender
      });

      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      localStorage.setItem("pendingVerificationEmail", user.email);

      console.log("✅ Account created, verification email sent.");
      setError("");
      setIsLoading(false);
      navigate("/verify-email");
    } catch (error) {
      console.error("Signup error:", error);
      const userFriendlyMessage = getErrorMessage(error);
      setError(userFriendlyMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
      </div>

      <div className="signup-container">
        {/* Left Side - Signup Form */}
        <div className="signup-form-section">
          <Link to="/" className="back-to-home">
            <span className="back-arrow">←</span>
            Back to Home
          </Link>

          <div className="form-content-wrapper">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Join thousands of women taking control of their wellness</p>
            </div>

            {error && <div className="error-message">{error}</div>}

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
                    placeholder="Password"
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
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="gender-select"
                  required
                >
                  <option value="" disabled>Select your gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-agreement">
                <label className="agreement-checkbox">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  I agree to the{" "}
                  <Link to="/terms" className="terms-link">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="privacy-link">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button type="submit" className="signup-button" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Your Luneverse Account"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="google-login-btn"
            >
              Sign up with Google
            </button>

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
        </div>

        {/* Right Side - Welcome Section */}
        <div className="signup-welcome">
          <div className="welcome-content">
            <h1>Welcome to Your Wellness Journey</h1>
            <p>Join thousands of women discovering their inner strength</p>
            <div className="welcome-features">
              <div className="feature-item"><span className="feature-icon">🌸</span><span>Track Your Cycle</span></div>
              <div className="feature-item"><span className="feature-icon">💭</span><span>Journal Your Thoughts</span></div>
              <div className="feature-item"><span className="feature-icon">📈</span><span>Monitor Your Mood</span></div>
              <div className="feature-item"><span className="feature-icon">🌙</span><span>Find Your Balance</span></div>
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
