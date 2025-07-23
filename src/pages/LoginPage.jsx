import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Styles/LoginPage.css";
import { auth } from "../firebase/config"; // adjust the path if needed
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User signed in:", userCredential.user);
    // Redirect to dashboard or diary page
    navigate("/dashboard"); // You can change this route name based on your project
  } catch (error) {
    console.error("Login error:", error.message);
    alert("Login failed. Please check your email and password.");
  }
};

  return (
    <div className="login-page">
      {/* Background Elements */}
      <div className="login-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
      </div>

      {/* Main Content */}
      <div className="login-container">
        {/* Left Side - Welcome Back */}
        <div className="login-welcome">
          <div className="welcome-content">
            <h1>Welcome Back</h1>
            <p>Continue your wellness journey with Luneverse</p>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon">📝</span>
                <span>Private Journaling</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Mood Tracking</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌸</span>
                <span>Cycle Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="form-header">
            <Link to="/" className="back-to-home">
              <span className="back-arrow">←</span>
              Back to Home
            </Link>
            <h2>Sign In</h2>
            <p>Enter your credentials to access your personal sanctuary</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
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
              <label className="remember-me">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-button">
              Sign In to Luneverse
            </button>
          </form>

          <div className="form-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="signup-link">
                Create one here
              </Link>
            </p>
            <div className="privacy-note">
              <span className="privacy-icon">🔒</span>
              Your data is encrypted and completely private
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
