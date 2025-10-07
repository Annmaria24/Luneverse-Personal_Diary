import React, { useEffect, useState } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import './Styles/Admin.css';
import { auth } from '../../firebase/config';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useTheme } from '../../context/ThemeContext';
import { useSiteName } from '../../context/SiteNameContext';

const AdminSettings = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState({});
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'password'
  const user = auth.currentUser;
  const { theme, changeTheme } = useTheme();
  const { siteName, updateSiteName } = useSiteName();

  useEffect(() => {
    // Get current user email from auth
    if (user?.email) {
      setEmail(user.email);
      console.log('Current admin email:', user.email);
    } else {
      console.log('No current user found');
    }
  }, [user]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const clearMessages = () => {
    setErrors({});
    setSuccess({});
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    clearMessages();
    
    try {
      const newSiteName = siteName.trim();
      if (!newSiteName) {
        setErrors({ siteName: 'Site name is required' });
        return;
      }
      
      const success = await updateSiteName(newSiteName);
      if (success) {
        setSuccess({ siteName: 'Site name updated successfully!' });
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess({}), 3000);
      } else {
        setErrors({ siteName: 'Failed to save site name. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setErrors({ siteName: 'Failed to save site name. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrors({ email: 'No user logged in' });
      return;
    }
    setSaving(true);
    clearMessages();
    
    try {
      // Validation
      if (!email.trim()) {
        setErrors({ email: 'Email is required' });
        return;
      }
      
      if (!validateEmail(email)) {
        setErrors({ email: 'Please enter a valid email address' });
        return;
      }
      
      if (!newPassword.trim()) {
        setErrors({ email: 'New password is required to change email' });
        return;
      }
      
      if (!validatePassword(newPassword)) {
        setErrors({ email: 'New password must be at least 6 characters long' });
        return;
      }
      
      if (!currentPassword.trim()) {
        setErrors({ email: 'Current password is required to change email' });
        return;
      }
      
      console.log('Attempting to change email from:', user.email, 'to:', email.trim());
      
      // Re-authenticate user
      const cred = EmailAuthProvider.credential(user.email || '', currentPassword);
      await reauthenticateWithCredential(user, cred);
      console.log('Re-authentication successful');
      
      // Update email
      await updateEmail(user, email.trim());
      console.log('Email update successful');
      
      // Update password
      await updatePassword(user, newPassword);
      console.log('Password update successful');
      
      setSuccess({ email: 'Email and password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setEmail(email.trim()); // Update the displayed email
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess({}), 3000);
    } catch (error) {
      console.error('Error changing email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/wrong-password') {
        setErrors({ email: 'Current password is incorrect' });
      } else if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already in use' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ email: 'Invalid email address' });
      } else if (error.code === 'auth/requires-recent-login') {
        setErrors({ email: 'Please log out and log back in, then try again' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ email: 'New password is too weak. Please choose a stronger password.' });
      } else {
        setErrors({ email: `Failed to update email: ${error.message}` });
      }
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    clearMessages();
    
    try {
      // Validation
      if (!password.trim()) {
        setErrors({ password: 'New password is required' });
        return;
      }
      
      if (!validatePassword(password)) {
        setErrors({ password: 'Password must be at least 6 characters long' });
        return;
      }
      
      if (!currentPassword.trim()) {
        setErrors({ password: 'Current password is required to change password' });
        return;
      }
      
      // Re-authenticate user
      const cred = EmailAuthProvider.credential(user.email || '', currentPassword);
      await reauthenticateWithCredential(user, cred);
      
      // Update password
      await updatePassword(user, password);
      setSuccess({ password: 'Password updated successfully!' });
      setPassword('');
      setCurrentPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess({}), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        setErrors({ password: 'Current password is incorrect' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Password is too weak. Please choose a stronger password.' });
      } else {
        setErrors({ password: 'Failed to update password. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-wrap">
      <AdminNavbar />
      <div className="admin-container">
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Admin Settings</h2>

        <div className="settings-grid">
          <form onSubmit={saveConfig} className="panel app-config-panel">
            <div className="panel-header">
              <h3>App Configuration</h3>
            </div>
            <div className="form-group">
              <label className="form-label">
                <span>Site Name</span>
                <input 
                  className={`input ${errors.siteName ? 'error' : ''}`}
                  value={siteName} 
                  onChange={e => setSiteName(e.target.value)} 
                  placeholder="Enter site name"
                />
                {errors.siteName && <span className="error-message">{errors.siteName}</span>}
                {success.siteName && <span className="success-message">{success.siteName}</span>}
              </label>
              <label className="form-label">
                <span>Theme</span>
                <select className="select" value={theme} onChange={e => changeTheme(e.target.value)}>
                  <option value="midnight">Midnight</option>
                  <option value="lavender">Lavender</option>
                  <option value="rose">Rose</option>
                </select>
              </label>
              <div className="form-actions">
                <button className="button primary" disabled={saving} type="submit">
                  {saving ? 'Saving...' : 'Save Config'}
                </button>
              </div>
            </div>
          </form>

          <div className="panel">
            <div className="panel-header">
              <h3>Admin Account</h3>
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'email' ? 'active' : ''}`} 
                  onClick={() => { clearMessages(); setActiveTab('email'); }}
                  type="button"
                >
                  Change Email
                </button>
                <button 
                  className={`tab-button ${activeTab === 'password' ? 'active' : ''}`} 
                  onClick={() => { clearMessages(); setActiveTab('password'); }}
                  type="button"
                >
                  Change Password
                </button>
              </div>
            </div>


            {activeTab === 'email' && (
          <form onSubmit={changeEmail} className="form-group" autoComplete="on" name="change-email-form">
                <label className="form-label">
                  <span>Admin Email</span>
                  <input 
                    className={`input ${errors.email ? 'error' : ''}`}
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    type="email" 
                    placeholder="admin@example.com"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                  {success.email && <span className="success-message">{success.email}</span>}
                </label>
                <label className="form-label">
                  <span>New Password</span>
                  <div className="password-input-container">
                    <input 
                      className={`input ${errors.email ? 'error' : ''}`}
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      type={showPassword.email ? "text" : "password"}
                      placeholder="Enter new password"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(prev => ({ ...prev, email: !prev.email }))}
                    >
                      {showPassword.email ? '🙈' : '👁️'}
                    </button>
                  </div>
                </label>
                <label className="form-label">
                  <span>Current Password (for re-auth)</span>
                  <div className="password-input-container">
                    <input 
                      className="input" 
                      name="current-password-email"
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)} 
                      type={showCurrentPassword.email ? "text" : "password"}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(prev => ({ ...prev, email: !prev.email }))}
                    >
                      {showCurrentPassword.email ? '🙈' : '👁️'}
                    </button>
                  </div>
                </label>
                <div className="form-actions">
                  <button className="button success" disabled={saving} type="submit">
                    {saving ? 'Updating...' : 'Change Email'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
          <form onSubmit={changePassword} className="form-group" autoComplete="on" name="change-password-form">
                <label className="form-label">
                  <span>New Password</span>
                  <div className="password-input-container">
                    <input 
                      className={`input ${errors.password ? 'error' : ''}`}
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      type={showPassword.password ? "text" : "password"}
                      placeholder="Enter new password"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(prev => ({ ...prev, password: !prev.password }))}
                    >
                      {showPassword.password ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                  {success.password && <span className="success-message">{success.password}</span>}
                </label>
                <label className="form-label">
                  <span>Current Password (for re-auth)</span>
                  <div className="password-input-container">
                    <input 
                      className="input" 
                      name="current-password-password"
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)} 
                      type={showCurrentPassword.password ? "text" : "password"}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(prev => ({ ...prev, password: !prev.password }))}
                    >
                      {showCurrentPassword.password ? '🙈' : '👁️'}
                    </button>
                  </div>
                </label>
                <div className="form-actions">
                  <button className="button danger" disabled={saving} type="submit">
                    {saving ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;


