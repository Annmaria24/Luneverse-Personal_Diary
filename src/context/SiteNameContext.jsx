import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SiteNameContext = createContext();

export const useSiteName = () => {
  const context = useContext(SiteNameContext);
  if (!context) {
    throw new Error('useSiteName must be used within a SiteNameProvider');
  }
  return context;
};

export const SiteNameProvider = ({ children }) => {
  const [siteName, setSiteName] = useState('Luneverse');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSiteName = async () => {
      try {
        const cfgSnap = await getDoc(doc(db, 'config', 'app'));
        if (cfgSnap.exists()) {
          const data = cfgSnap.data();
          setSiteName(data.siteName || 'Luneverse');
        }
      } catch (error) {
        console.error('Error loading site name:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSiteName();
  }, []);

  const updateSiteName = async (newSiteName) => {
    try {
      await setDoc(doc(db, 'config', 'app'), { siteName: newSiteName.trim() }, { merge: true });
      setSiteName(newSiteName.trim());
      return true;
    } catch (error) {
      console.error('Error updating site name:', error);
      return false;
    }
  };

  const value = {
    siteName,
    updateSiteName,
    loading
  };

  return (
    <SiteNameContext.Provider value={value}>
      {children}
    </SiteNameContext.Provider>
  );
};


