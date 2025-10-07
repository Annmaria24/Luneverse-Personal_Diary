import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut, updatePassword, updateEmail, getAuth, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CustomModal from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import './Styles/SettingsPage.css';
import Navbar from '../components/Navbar';

function SettingsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      loadUserSettings();
      loadPregnancyTrackingSetting();
    }
  }, [currentUser]);

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
      // Update Firebase Auth profile if displayName or email changed
      const authInstance = getAuth();
      if (currentUser.displayName !== displayName) {
        await updateProfile(authInstance.currentUser, { displayName });
      }
      if (currentUser.email !== email) {
        await updateEmail(authInstance.currentUser, email);
      }

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
      // Refresh page after successful save
      window.location.reload();
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await updatePassword(currentUser, newPassword);
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update password: ' + error.message);
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
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🛡️' },
    { id: 'data', name: 'Data', icon: '📊' }
  ];

  return (
    <div className="settings-page">
      <Navbar />

      <div className="dashboard-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
        <div className="floating-element element-6">🌺</div>
      </div>

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


              {/* Pregnancy Tracking Toggle */}
              <div className="setting-item" style={{marginTop: '1rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.1)'}}>
                <div className="setting-info">
                  <h4 style={{margin: 0, color: '#7c3aed'}}>🤰 Pregnancy Tracking</h4>
                  <p style={{margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#64748b'}}>
                    Enable pregnancy tracking features and insights
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={pregnancyTrackingEnabled}
                    onChange={(e) => setPregnancyTrackingEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="save-btn"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
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
    </div>
  );
}

export default SettingsPage;
