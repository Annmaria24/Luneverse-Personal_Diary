import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserProfile, updateLastLogin } from '../services/userService';
import Loader from '../pages/Loading';

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
