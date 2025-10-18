import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProfileDropdown from './ProfileDropdown';
import UserFeedbackModal from './UserFeedbackModalSimple';
import './Styles/Navbar.css';

const Navbar = ({ searchProps, viewToggleProps }) => {
  const location = useLocation();
  const { currentUser, modulePreferences } = useAuth();
  const [showPregnancyTracker, setShowPregnancyTracker] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [siteName, setSiteName] = useState('Luneverse');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    const checkPregnancyTrackerVisibility = async () => {
      if (!currentUser) {
        setShowPregnancyTracker(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const hasConceptionDate = data.conceptionDate;
          const pregnancyTrackingEnabled = data.pregnancyTrackingEnabled;

          // Show Pregnancy Tracker link when pregnancy tracking is enabled
          setShowPregnancyTracker(pregnancyTrackingEnabled || false);
        } else {
          setShowPregnancyTracker(false);
        }
      } catch (error) {
        console.error('Error checking pregnancy tracker visibility:', error);
        setShowPregnancyTracker(false);
      }
    };

    checkPregnancyTrackerVisibility();
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      if (currentUser) {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        setIsAdmin(snap.exists() ? !!snap.data().isAdmin : false);
      } else {
        setIsAdmin(false);
      }
      const cfg = await getDoc(doc(db, 'config', 'app'));
      if (cfg.exists()) setSiteName(cfg.data().siteName || 'Luneverse');
    };
    load();
  }, [currentUser]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    setCurrentDate(now.toLocaleDateString(undefined, options));
    setGreeting(getGreeting());
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <NavLink to="/dashboard" className="navbar-logo" title="Luneverse Dashboard">
          <div className="navbar-logo-text">
            <span>🌙 {siteName}</span>
            <div className="navbar-date">{currentDate}</div>
          </div>
        </NavLink>
        {/* Moved search bar and view toggle here for better layout */}
        {(location.pathname === '/diary' || location.pathname === '/my-journal') && searchProps && (
          <div className="navbar-search" style={{ marginLeft: '0.5rem' }}>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchProps.searchTerm}
                onChange={(e) => {
                  searchProps.setSearchTerm(e.target.value);
                  if (e.target.value.trim()) {
                    searchProps.handleSearch();
                  } else {
                    searchProps.clearSearch();
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && searchProps.handleSearch()}
                className="search-input"
              />
              {searchProps.searchTerm && (
                <button onClick={searchProps.clearSearch} className="clear-search-btn" disabled={searchProps.loading}>
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Per-page controls removed from Navbar to keep it consistent */}

        {location.pathname === '/pregnancy-tracker' && viewToggleProps && viewToggleProps.pregnancyInfo && (
          <div className="navbar-pregnancy-info" style={{ marginLeft: '2rem' }}>
            <span className="navbar-week-info">🤰 Week {viewToggleProps.pregnancyInfo.currentWeek}</span>
            <span className="navbar-trimester">T{viewToggleProps.pregnancyInfo.trimester}</span>
          </div>
        )}
      </div>
      <div className="navbar-center">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Dashboard
        </NavLink>
        {modulePreferences.journal && (
          <NavLink
            to="/my-journal"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            My Journal
          </NavLink>
        )}
        {(modulePreferences.cycleTracker || modulePreferences.pregnancyTracker) && (
          <NavLink
            to="/my-cycle"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            My Cycle
          </NavLink>
        )}
        {modulePreferences.relaxMode && (
          <NavLink
            to="/relax"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Relax
          </NavLink>
        )}
        {currentUser && currentUser.emailVerified && (
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="nav-link feedback-button"
            title="Share your feedback"
          >
            💬 Feedback
          </button>
        )}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Admin
          </NavLink>
        )}
      </div>
      <div className="navbar-right">
        <div className="navbar-greeting">{greeting}, {currentUser?.displayName || currentUser?.email || 'User'}</div>
        <ProfileDropdown />
      </div>

      <UserFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        currentUser={currentUser}
      />
    </nav>
  );
};

export default Navbar;

