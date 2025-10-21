import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signOut, updatePassword, updateEmail, getAuth, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CustomModal from '../components/CustomModal';
import ModulePreferences from '../components/ModulePreferences';
import { useModal } from '../hooks/useModal';
import './Styles/SettingsPage.css';
import Navbar from '../components/Navbar';

function SettingsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { modalState, hideModal, showConfirm } = useModal();

  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [location, setLocation] = useState('');

  // Privacy settings
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  // Notification settings
  const [periodReminders, setPeriodReminders] = useState(true);
  const [moodReminders, setMoodReminders] = useState(true);
  const [journalReminders, setJournalReminders] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);

  // Pregnancy tracking settings
  const [pregnancyTrackingEnabled, setPregnancyTrackingEnabled] = useState(false);
  const [conceptionDate, setConceptionDate] = useState('');

  // Security settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Email change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForReauth, setPasswordForReauth] = useState('');
  const [pendingEmailChange, setPendingEmailChange] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      loadUserSettings();
      loadPregnancyTrackingSetting();
    }
  }, [currentUser]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'privacy', 'notifications', 'security', 'modules'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loadPregnancyTrackingSetting = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setPregnancyTrackingEnabled(data.pregnancyTrackingEnabled || false);
      }
    } catch (error) {
      console.error('Error loading pregnancy tracking setting:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setDateOfBirth(data.dateOfBirth || '');
        setLocation(data.location || '');
        setDataSharing(data.dataSharing || false);
        setAnalytics(data.analytics !== undefined ? data.analytics : true);
        setNotifications(data.notifications !== undefined ? data.notifications : true);
        setPublicProfile(data.publicProfile || false);
        setPeriodReminders(data.periodReminders !== undefined ? data.periodReminders : true);
        setMoodReminders(data.moodReminders !== undefined ? data.moodReminders : true);
        setJournalReminders(data.journalReminders || false);
        setWeeklyReports(data.weeklyReports !== undefined ? data.weeklyReports : true);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Update Firebase Auth profile if displayName changed
      const authInstance = getAuth();
      if (currentUser.displayName !== displayName) {
        await updateProfile(authInstance.currentUser, { displayName });
      }

      // Check if email changed and handle reauthentication
      if (currentUser.email !== email) {
        setPendingEmailChange(email);
        setShowPasswordModal(true);
        setIsLoading(false);
        return; // Exit early, will continue after password confirmation
      }

      // If no email change, proceed with Firestore update
      await updateFirestoreProfile();
      
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
      setIsLoading(false);
    }
  };

  const updateFirestoreProfile = async () => {
    try {
      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        dateOfBirth,
        location,
        dataSharing,
        analytics,
        notifications,
        publicProfile,
        periodReminders,
        moodReminders,
        journalReminders,
        weeklyReports,
        pregnancyTrackingEnabled
      }, { merge: true });

      setMessage('Profile updated successfully!');
      // Clean state refresh instead of page reload
      setPasswordForReauth('');
      setPendingEmailChange(null);
      setShowPasswordModal(false);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordConfirm = async () => {
    if (!passwordForReauth.trim()) {
      setError('Password is required for email change');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForReauth);
      await reauthenticateWithCredential(currentUser, credential);

      // Now update the email
      await updateEmail(currentUser, pendingEmailChange);

      // Update Firestore with new email
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        email: pendingEmailChange,
        dateOfBirth,
        location,
        dataSharing,
        analytics,
        notifications,
        publicProfile,
        periodReminders,
        moodReminders,
        journalReminders,
        weeklyReports,
        pregnancyTrackingEnabled
      }, { merge: true });

      setMessage('Email updated successfully! Please check your new email for verification.');
      
      // Clean up modal state
      setPasswordForReauth('');
      setPendingEmailChange(null);
      setShowPasswordModal(false);
      
      // Update local email state
      setEmail(pendingEmailChange);
      
    } catch (error) {
      console.error('Error updating email:', error);
      
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use by another account.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in, then try again.');
      } else {
        setError('Failed to update email: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordForReauth('');
    setPendingEmailChange(null);
    setError('');
    // Revert email to original value if user cancels
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  };

  const handleChangePassword = async () => {
  if (!currentPassword.trim()) {
    setError('Please enter your current password.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setError('Passwords do not match.');
    return;
  }

  if (newPassword.length < 6) {
    setError('Password must be at least 6 characters.');
    return;
  }

  setIsLoading(true);
  setError('');
  setMessage('');

  try {
    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    // Update password
    await updatePassword(currentUser, newPassword);

    setMessage('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch (error) {
    console.error('Error updating password:', error);

    if (error.code === 'auth/wrong-password') {
      setError('Incorrect current password. Please try again.');
    } else if (error.code === 'auth/weak-password') {
      setError('New password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/requires-recent-login') {
      setError('Please log out and log back in, then try again.');
    } else {
      setError('Failed to update password: ' + error.message);
    }
  } finally {
    setIsLoading(false);
  }
};


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      setError('Failed to sign out: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    showConfirm(
      'Are you sure you want to delete your account? This action cannot be undone.',
      async () => {
        try {
          // TODO: Implement account deletion
          setMessage('Account deletion requested. Please check your email for confirmation.');
        } catch (error) {
          setError('Failed to delete account: ' + error.message);
        }
      },
      'Delete Account'
    );
  };



  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'modules', name: 'Manage Features', icon: '⚙️' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🛡️' },
    { id: 'data', name: 'Data', icon: '📊' }
  ];

  return (
    <div className="settings-page">
      <Navbar />


      <div className="settings-container">
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <h3>{currentUser?.displayName || 'User'}</h3>
              <p>{currentUser?.email}</p>
            </div>
          </div>

          <nav className="settings-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-name">{tab.name}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-actions">
            <button onClick={handleSignOut} className="sign-out-btn">
              <span>🚪</span>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="settings-content">
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>


              {/* Note: Pregnancy tracking is now managed in the "Manage Modules" tab */}

              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="save-btn"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="settings-section">
              <ModulePreferences />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>Privacy Settings</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Data Sharing</h4>
                    <p>Allow anonymous data sharing for research purposes</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={dataSharing}
                      onChange={(e) => setDataSharing(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Analytics</h4>
                    <p>Help improve the app by sharing usage analytics</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Public Profile</h4>
                    <p>Make your profile visible to other users</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={publicProfile}
                      onChange={(e) => setPublicProfile(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Period Reminders</h4>
                    <p>Get notified about upcoming periods</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={periodReminders}
                      onChange={(e) => setPeriodReminders(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Mood Reminders</h4>
                    <p>Daily reminders to track your mood</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={moodReminders}
                      onChange={(e) => setMoodReminders(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Journal Reminders</h4>
                    <p>Reminders to write in your journal</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={journalReminders}
                      onChange={(e) => setJournalReminders(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Weekly Reports</h4>
                    <p>Receive weekly wellness summaries</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={weeklyReports}
                      onChange={(e) => setWeeklyReports(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <div className="security-section">
                <h3>Change Password</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="save-btn"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-item">
                  <div className="danger-info">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all associated data</p>
                  </div>
                  <button onClick={handleDeleteAccount} className="danger-btn">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="settings-section">
              <h2>Data Management</h2>
              <div className="data-actions">
                <div className="data-item">
                  <div className="data-info">
                    <h4>Export Data</h4>
                    <p>Download all your data in JSON format</p>
                  </div>
                  <button className="export-btn">Export Data</button>
                </div>
                <div className="data-item">
                  <div className="data-info">
                    <h4>Import Data</h4>
                    <p>Import data from another wellness app</p>
                  </div>
                  <button className="import-btn">Import Data</button>
                </div>
                <div className="data-item">
                  <div className="data-info">
                    <h4>Clear All Data</h4>
                    <p>Remove all your entries and start fresh</p>
                  </div>
                  <button className="danger-btn">Clear Data</button>
                </div>
              </div>
            </div>
          )}
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

      {/* Password Confirmation Modal for Email Change */}
      <CustomModal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        title="Confirm Password"
        message={
          <div style={{ textAlign: 'left' }}>
            <p>To change your email address, please enter your current password:</p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Current Password:
              </label>
              <input
                type="password"
                value={passwordForReauth}
                onChange={(e) => setPasswordForReauth(e.target.value)}
                placeholder="Enter your current password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                autoFocus
              />
            </div>
          </div>
        }
        type="confirm"
        onConfirm={handlePasswordConfirm}
        confirmText={isLoading ? 'Verifying...' : 'Confirm'}
        cancelText="Cancel"
        showCancel={true}
      />
    </div>
  );
}

export default SettingsPage;
