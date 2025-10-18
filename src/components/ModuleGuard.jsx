import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ModuleGuard = ({ children, requiredModule }) => {
  const { modulePreferences } = useAuth();

  // If the required module is not enabled, redirect to dashboard
  if (!modulePreferences[requiredModule]) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ModuleGuard;

