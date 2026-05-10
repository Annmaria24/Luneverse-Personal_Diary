import React, { useState } from "react";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../utils/errorMessages";
import "./Styles/SetPasswordPage.css";

function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!gender) {
      toast.error("Please select a gender");
      return;
    }

    try {
      await updatePassword(auth.currentUser, password);

      // Mark user as having a password and save gender in Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        hasPassword: true,
        gender: gender,
      });

      toast.success("Password set successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("Set password error:", error);
      const userFriendlyMessage = getErrorMessage(error);
      toast.error(userFriendlyMessage);
    }
  };

  return (
    <div className="set-password-page">
      {/* Background with floating elements */}
      <div className="set-password-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
      </div>

      <div className="set-password-container">
        <h2>Complete Your Profile</h2>
        <p>Set a password and complete your details to continue.</p>

        <form onSubmit={handleSubmit}>
          {/* Password */}
          <div className="input-group">
            <label htmlFor="password">New Password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
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

          {/* Confirm Password */}
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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

          {/* Gender */}
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

          <button type="submit" className="save-password-btn">
            Complete Profile
          </button>
        </form>
      </div>

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
}

export default SetPasswordPage;
