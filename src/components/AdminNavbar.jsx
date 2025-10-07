import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSiteName } from '../context/SiteNameContext';

const AdminNavbar = () => {
  const { siteName } = useSiteName();

  return (
    <nav className="navbar" style={{ background: 'linear-gradient(135deg, #0b1020, #131a33)' }}>
      <div className="navbar-left">
        <NavLink to="/admin" className="navbar-logo" title="Admin Dashboard">
          <div className="navbar-logo-text">
            <span>🛠️ {siteName} Admin</span>
          </div>
        </NavLink>
      </div>
      <div className="navbar-center">
        <NavLink 
          to="/admin" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          Overview
        </NavLink>
        <NavLink 
          to="/admin/users" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Users
        </NavLink>
        <NavLink 
          to="/admin/feedback" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Feedback
        </NavLink>
        <NavLink 
          to="/admin/settings" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Settings
        </NavLink>
      </div>
      <div className="navbar-right" />
    </nav>
  );
};

export default AdminNavbar;



