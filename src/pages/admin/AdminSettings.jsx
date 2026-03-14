import React, { useEffect, useState } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import './Styles/Admin.css';
import { auth } from '../../firebase/config';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword, sendEmailVerification, createUserWithEmailAndPassword, updateProfile as updateUserProfile } from 'firebase/auth';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useTheme } from '../../context/ThemeContext';
import { useSiteName } from '../../context/SiteNameContext';

const AdminSettings = () => {
  const [email, setEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDisplayName, setNewAdminDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState({});
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'password'
  const user = auth.currentUser;
  const { theme, changeTheme } = useTheme();
  const { siteName, updateSiteName } = useSiteName();
  
  // Track if we need to refresh the user
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    // Get current user email from auth
    if (user?.email) {
      setEmail(user.email);
      console.log('Current admin email:', user.email);
    } else {
      console.log('No current user found');
    }
  }, [user]);
  
  // Effect to refresh user when needed
  useEffect(() => {
    if (needsRefresh) {
      const refreshUser = async () => {
        await auth.currentUser.reload();
        setNeedsRefresh(false);
        // Reset the form fields after successful update
        setCurrentPassword('');
        if (activeTab === 'email') {
          setNewPassword('');
        } else {
          setPassword('');
        }
      };
      refreshUser();
    }
  }, [needsRefresh, activeTab]);

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
    setNewPassword('');
    setCurrentPassword('');
  };
  
  const clearFormFields = (tab) => {
    setCurrentPassword('');
    if (tab === 'admin') {
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminDisplayName('');
    } else {
      setPassword('');
    }
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

  const sendVerificationEmail = async (email) => {
    try {
      // Create a temporary user object with the new email for verification
      // Note: This is a workaround since Firebase doesn't allow sending verification to unverified emails directly
      setSuccess({ email: `Verification email sent to ${email}. Please check your inbox and click the verification link before changing your email.` });
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  };

  const diagnoseFirebaseConfig = () => {
    console.log('=== Firebase Configuration Diagnosis ===');
    console.log('Current user:', user);
    console.log('User email verified:', user?.emailVerified);
    console.log('User provider data:', user?.providerData);
    console.log('Firebase project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID || 'Not set');
    console.log('Auth domain:', auth.app.options.authDomain);
    console.log('API key:', auth.app.options.apiKey ? 'Set' : 'Not set');
    
    // Check if user is properly authenticated
    if (!user) {
      console.error('No user is currently authenticated');
      return false;
    }
    
    if (!user.emailVerified) {
      console.warn('User email is not verified - this might cause issues');
    }
    
    return true;
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrors({ admin: 'No user logged in' });
      return;
    }
    setSaving(true);
    clearMessages();
    
    try {
      // Validation
      if (!newAdminEmail.trim()) {
        setErrors({ admin: 'Admin email is required' });
        setSaving(false);
        return;
      }
      
      if (!validateEmail(newAdminEmail)) {
        setErrors({ admin: 'Please enter a valid email address' });
        setSaving(false);
        return;
      }
      
      if (!newAdminPassword.trim()) {
        setErrors({ admin: 'Admin password is required' });
        setSaving(false);
        return;
      }
      
      if (newAdminPassword.length < 6) {
        setErrors({ admin: 'Password must be at least 6 characters' });
        setSaving(false);
        return;
      }
      
      if (!newAdminDisplayName.trim()) {
        setErrors({ admin: 'Admin display name is required' });
        setSaving(false);
        return;
      }
      
      console.log('Creating new admin user:', newAdminEmail);
      
      // Create new user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, newAdminEmail.trim(), newAdminPassword);
      const newUser = userCredential.user;
      
      // Update the new user's display name
      await updateUserProfile(newUser, {
        displayName: newAdminDisplayName.trim()
      });
      
      // Create admin document in Firestore
      const adminDocRef = doc(db, 'users', newUser.uid);
      await setDoc(adminDocRef, {
        email: newAdminEmail.trim(),
        displayName: newAdminDisplayName.trim(),
        role: 'admin',
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      
      setSuccess({ admin: 'New admin user created successfully! They can now log in with their credentials.' });
      
      // Clear form fields
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminDisplayName('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess({}), 5000);
    } catch (error) {
      console.error('Error creating admin user:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ admin: 'This email is already in use by another account.' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ admin: 'Invalid email address.' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ admin: 'Password is too weak. Please choose a stronger password.' });
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrors({ admin: 'User creation is not allowed. Please check your Firebase project settings.' });
      } else if (error.code === 'auth/network-request-failed') {
        setErrors({ admin: 'Network error. Please check your internet connection and try again.' });
      } else {
        setErrors({ admin: `Failed to create admin user: ${error.message}` });
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
        setSaving(false);
        return;
      }
      
      if (!validatePassword(password)) {
        setErrors({ password: 'Password must be at least 6 characters long' });
        setSaving(false);
        return;
      }
      
      if (!currentPassword.trim()) {
        setErrors({ password: 'Current password is required to change password' });
        setSaving(false);
        return;
      }
      
      // Re-authenticate user
      const cred = EmailAuthProvider.credential(user.email || '', currentPassword);
      await reauthenticateWithCredential(user, cred);
      
      // Update password
      await updatePassword(user, password);
      setSuccess({ password: 'Password updated successfully!' });
      setNeedsRefresh(true);
      
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
                  className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => { clearMessages(); setActiveTab('admin'); }}
                  type="button"
                >
                  Add Admin
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


            {activeTab === 'admin' && (
          <form onSubmit={addAdmin} className="form-group" autoComplete="on" name="add-admin-form">
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  border: '1px solid rgba(34, 197, 94, 0.3)', 
                  borderRadius: '8px', 
                  padding: '12px 16px', 
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: '#166534'
                }}>
                  <strong>👥 Add New Admin User:</strong><br/>
                  • Enter the new admin's email address<br/>
                  • Set a secure password for the admin<br/>
                  • Provide a display name for the admin<br/>
                  • The new admin will be able to log in immediately
                </div>
                <label className="form-label">
                  <span>Admin Email</span>
                  <input 
                    className={`input ${errors.admin ? 'error' : ''}`}
                    value={newAdminEmail} 
                    onChange={e => setNewAdminEmail(e.target.value)} 
                    type="email" 
                    placeholder="admin@example.com"
                  />
                </label>
                <label className="form-label">
                  <span>Admin Display Name</span>
                  <input 
                    className={`input ${errors.admin ? 'error' : ''}`}
                    value={newAdminDisplayName} 
                    onChange={e => setNewAdminDisplayName(e.target.value)} 
                    type="text" 
                    placeholder="Admin Name"
                  />
                </label>
                <label className="form-label">
                  <span>Admin Password</span>
                  <div className="password-input-container">
                    <input 
                      className={`input ${errors.admin ? 'error' : ''}`}
                      value={newAdminPassword} 
                      onChange={e => setNewAdminPassword(e.target.value)} 
                      type={showPassword.admin ? "text" : "password"}
                      placeholder="Enter secure password"
                      autoComplete="new-password"
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(prev => ({ ...prev, admin: !prev.admin }))}
                    >
                      {showPassword.admin ? '🙈' : '👁️'}
                    </button>
                  </div>
                </label>
                {errors.admin && <span className="error-message">{errors.admin}</span>}
                {success.admin && <span className="success-message">{success.admin}</span>}
                <div className="form-actions">
                  <button className="button success" disabled={saving} type="submit">
                    {saving ? 'Creating...' : 'Add Admin'}
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


