import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const DEFAULT_MODULE_PREFERENCES = {
  journal: true,
  moodTracker: true,
  relaxMode: true,
  cycleTracker: false,
  pregnancyTracker: false
};

/**
 * Get user module preferences from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Module preferences object
 */
export const getModulePreferences = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const modulePrefs = userData.modulePreferences || {};
      
      // Sync pregnancy tracking setting with module preferences
      if (userData.pregnancyTrackingEnabled !== undefined) {
        modulePrefs.pregnancyTracker = userData.pregnancyTrackingEnabled;
      }
      
      // Merge with defaults to ensure all modules are defined
      return { ...DEFAULT_MODULE_PREFERENCES, ...modulePrefs };
    } else {
      // Create new user document with default preferences
      await setDoc(userDocRef, {
        modulePreferences: DEFAULT_MODULE_PREFERENCES,
        pregnancyTrackingEnabled: DEFAULT_MODULE_PREFERENCES.pregnancyTracker,
        createdAt: new Date().toISOString()
      });
      return DEFAULT_MODULE_PREFERENCES;
    }
  } catch (error) {
    console.error('Error getting module preferences:', error);
    return DEFAULT_MODULE_PREFERENCES;
  }
};

/**
 * Update user module preferences in Firestore
 * @param {string} userId - User ID
 * @param {Object} preferences - Updated preferences object
 * @returns {Promise<boolean>} Success status
 */
export const updateModulePreferences = async (userId, preferences) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData = {
      modulePreferences: preferences,
      updatedAt: new Date().toISOString()
    };
    
    // Also update pregnancy tracking setting if it's being changed
    if (preferences.pregnancyTracker !== undefined) {
      updateData.pregnancyTrackingEnabled = preferences.pregnancyTracker;
    }
    
    await updateDoc(userDocRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating module preferences:', error);
    return false;
  }
};

/**
 * Check if a specific module is enabled for a user
 * @param {string} userId - User ID
 * @param {string} moduleName - Name of the module to check
 * @returns {Promise<boolean>} Whether the module is enabled
 */
export const isModuleEnabled = async (userId, moduleName) => {
  try {
    const preferences = await getModulePreferences(userId);
    return preferences[moduleName] || false;
  } catch (error) {
    console.error('Error checking module status:', error);
    return DEFAULT_MODULE_PREFERENCES[moduleName] || false;
  }
};

/**
 * Get module display names and descriptions
 * @returns {Object} Module metadata
 */
export const getModuleMetadata = () => {
  return {
    journal: {
      name: 'Digital Diary',
      description: 'Reflect and write about your day or thoughts',
      icon: '📝',
      category: 'core'
    },
    moodTracker: {
      name: 'Mood Tracker',
      description: 'Track emotional trends and patterns over time',
      icon: '📊',
      category: 'core'
    },
    relaxMode: {
      name: 'Relax Mode',
      description: 'Breathing exercises, affirmations, and wellness tools',
      icon: '🧘',
      category: 'core'
    },
    cycleTracker: {
      name: 'Cycle Tracker',
      description: 'Log and view menstrual cycles with predictions',
      icon: '🌸',
      category: 'health'
    },
    pregnancyTracker: {
      name: 'Pregnancy Tracker',
      description: 'Monitor pregnancy progress and milestones',
      icon: '🤰',
      category: 'health'
    }
  };
};
