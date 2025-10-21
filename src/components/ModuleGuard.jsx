import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ModuleGuard = ({ children, requiredModule }) => {
  const { modulePreferences } = useAuth();

  // Special case for health module - allow if either cycle or pregnancy is enabled
  if (requiredModule === 'cycleTracker') {
    if (!modulePreferences.cycleTracker && !modulePreferences.pregnancyTracker) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // For other modules, check the specific module
  if (!modulePreferences[requiredModule]) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ModuleGuard;
