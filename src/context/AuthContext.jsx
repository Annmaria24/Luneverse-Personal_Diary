import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserProfile, updateLastLogin } from '../services/userService';
import Loader from '../pages/Loading';
import { endSession, recordAggregates, startSession } from '../services/activityService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email, 'Verified:', user?.emailVerified);
      
      if (user && user.emailVerified) {
        // User is signed in and email is verified
        setCurrentUser(user);
        
        try {
          // Create/update user profile in Firestore
          const profile = await createUserProfile(user);
          await updateLastLogin(user.uid);
          setUserProfile(profile);
          console.log('✅ User session established:', user.email);
        } catch (error) {
          console.error('Error setting up user profile:', error);
        }
      } else if (user && !user.emailVerified) {
        // User is signed in but email not verified
        console.log('⚠️ User email not verified, keeping signed out');
        setCurrentUser(null);
        setUserProfile(null);
      } else {
        // User is signed out
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Track activity session start/stop and aggregate minutes
  useEffect(() => {
    let sessionId = null;
    let startTime = null;
    const begin = async () => {
      if (!currentUser) return;
      startTime = Date.now();
      sessionId = await startSession(currentUser.uid);
    };
    const finish = async () => {
      if (!currentUser || !sessionId || !startTime) return;
      const minutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      await endSession(sessionId);
      await recordAggregates(currentUser.uid, minutes);
      sessionId = null;
      startTime = null;
    };

    if (currentUser) {
      begin();
    }

    const handleVisibility = () => {
      if (document.hidden) {
        finish();
      } else if (currentUser) {
        begin();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', finish);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', finish);
      // ensure end when component unmounts or user changes
      finish();
    };
  }, [currentUser]);

  const value = {
    currentUser,
    userProfile,
    loading,
    isAuthenticated: !!currentUser && currentUser.emailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loader /> : children}
    </AuthContext.Provider>
  );
};
