import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import './Styles/ProfileDropdown.css';

const ProfileDropdown = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const getFirstName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="profile-dropdown">
      <div
        className="user-avatar"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        title={`${getFirstName(currentUser?.email)} - Click for options`}
      >
        {getFirstName(currentUser?.email).charAt(0).toUpperCase()}
      </div>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <span className="user-name">{getFirstName(currentUser?.email)}</span>
            <span className="user-email">{currentUser?.email}</span>
          </div>
          <div className="dropdown-divider"></div>
          <button
            onClick={() => {
              navigate('/settings');
              setIsDropdownOpen(false);
            }}
            className="dropdown-item"
          >
            <span className="dropdown-icon">⚙️</span>
            Settings
          </button>
          <button
            onClick={() => {
              navigate('/dashboard');
              setIsDropdownOpen(false);
            }}
            className="dropdown-item"
          >
            <span className="dropdown-icon">🏠</span>
            Dashboard
          </button>
          <div className="dropdown-divider"></div>
          <button
            onClick={() => {
              handleLogout();
              setIsDropdownOpen(false);
            }}
            className="dropdown-item logout-item"
          >
            <span className="dropdown-icon">🚪</span>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;