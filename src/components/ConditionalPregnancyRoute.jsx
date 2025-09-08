import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProtectedRoute from './ProtectedRoute';
import PregnancyTrackerPage from '../pages/PregnancyTrackerPage';

const ConditionalPregnancyRoute = () => {
  const { currentUser } = useAuth();
  const [canAccessPregnancyTracker, setCanAccessPregnancyTracker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setCanAccessPregnancyTracker(false);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const pregnancyTrackingEnabled = data.pregnancyTrackingEnabled;

          setCanAccessPregnancyTracker(pregnancyTrackingEnabled || false);
        } else {
          setCanAccessPregnancyTracker(false);
        }
      } catch (error) {
        console.error('Error checking pregnancy tracker access:', error);
        setCanAccessPregnancyTracker(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!canAccessPregnancyTracker) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤰</div>
        <h2>Pregnancy Tracker Not Available</h2>
        <p style={{ marginBottom: '20px', maxWidth: '400px' }}>
          To access the Pregnancy Tracker, you need to:
        </p>
        <ul style={{ textAlign: 'left', marginBottom: '20px' }}>
          <li>Enable pregnancy tracking in your Settings</li>
        </ul>
        <p>Go to Settings and enable the Pregnancy Tracking feature to access this page.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PregnancyTrackerPage />
    </ProtectedRoute>
  );
};

export default ConditionalPregnancyRoute;
