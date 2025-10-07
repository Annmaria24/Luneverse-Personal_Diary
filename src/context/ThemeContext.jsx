import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('midnight');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const cfgSnap = await getDoc(doc(db, 'config', 'app'));
        if (cfgSnap.exists()) {
          const data = cfgSnap.data();
          const savedTheme = data.theme || 'midnight';
          setTheme(savedTheme);
          applyTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const applyTheme = (themeName) => {
    // Remove existing theme classes
    document.body.classList.remove('theme-midnight', 'theme-lavender', 'theme-rose');
    
    // Add new theme class
    document.body.classList.add(`theme-${themeName}`);
    
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    
    switch (themeName) {
      case 'lavender':
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #ddd6fe 100%)');
        root.style.setProperty('--primary-text', '#581c87');
        root.style.setProperty('--secondary-text', '#7c3aed');
        root.style.setProperty('--accent-color', '#a855f7');
        root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--border-color', 'rgba(168, 85, 247, 0.2)');
        break;
      case 'rose':
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)');
        root.style.setProperty('--primary-text', '#be185d');
        root.style.setProperty('--secondary-text', '#ec4899');
        root.style.setProperty('--accent-color', '#f472b6');
        root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--border-color', 'rgba(244, 114, 182, 0.2)');
        break;
      case 'midnight':
      default:
        root.style.setProperty('--primary-bg', 'linear-gradient(135deg, #0b1020 0%, #1a1a2e 50%, #16213e 100%)');
        root.style.setProperty('--primary-text', '#e6e9f5');
        root.style.setProperty('--secondary-text', '#a7b0d0');
        root.style.setProperty('--accent-color', '#4b0082');
        root.style.setProperty('--card-bg', 'linear-gradient(135deg, #131a33 0%, #1e2a55 100%)');
        root.style.setProperty('--border-color', 'rgba(124, 58, 237, 0.2)');
        break;
    }
  };

  const changeTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      applyTheme(newTheme);
      
      // Save to Firestore
      await setDoc(doc(db, 'config', 'app'), { theme: newTheme }, { merge: true });
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  const value = {
    theme,
    changeTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};


