import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProfileDropdown from './ProfileDropdown';
import './Styles/Navbar.css';

const Navbar = ({ searchProps, viewToggleProps }) => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [showPregnancyTracker, setShowPregnancyTracker] = useState(false);

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

          setShowPregnancyTracker(hasConceptionDate && pregnancyTrackingEnabled);
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

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <NavLink to="/dashboard" className="navbar-logo" title="Luneverse Dashboard">
        🌙 Luneverse
        </NavLink>
        {/* Moved search bar and view toggle here for better layout */}
        {location.pathname === '/diary' && searchProps && (
          <div className="navbar-search" style={{ marginLeft: '2rem' }}>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
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
        <NavLink
          to="/diary"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Diary
        </NavLink>
        <NavLink
          to="/mood-tracker"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Mood Tracker
        </NavLink>
        <NavLink
          to="/cycle-tracker"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Cycle Tracker
        </NavLink>
        {showPregnancyTracker && (
          <NavLink
            to="/pregnancy-tracker"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Pregnancy Tracker
          </NavLink>
        )}
      </div>
      <div className="navbar-right">
        <ProfileDropdown />
      </div>
    </nav>
  );
};

export default Navbar;
