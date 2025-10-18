import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getModulePreferences, updateModulePreferences, getModuleMetadata } from '../services/modulePreferencesService';
import './Styles/ModulePreferences.css';

function ModulePreferences() {
  const { currentUser } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const moduleMetadata = getModuleMetadata();

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userPreferences = await getModulePreferences(currentUser.uid);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage('Error loading preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = (moduleName) => {
    setPreferences(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      const success = await updateModulePreferences(currentUser.uid, preferences);
      
      if (success) {
        setMessage('Preferences saved successfully! ✨');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences({
      journal: true,
      moodTracker: true,
      relaxMode: true,
      cycleTracker: false,
      pregnancyTracker: false
    });
  };

  if (loading) {
    return (
      <div className="module-preferences-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="module-preferences-container">
      <div className="preferences-header">
        <h2>Customize your Luneverse experience 🌙</h2>
        <p>Choose which wellness modules you'd like to use. You can change these anytime.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="modules-grid">
        {Object.entries(moduleMetadata).map(([moduleKey, metadata]) => (
          <div key={moduleKey} className={`module-card ${preferences[moduleKey] ? 'enabled' : 'disabled'}`}>
            <div className="module-header">
              <div className="module-icon">{metadata.icon}</div>
              <div className="module-info">
                <h3>{metadata.name}</h3>
                <p>{metadata.description}</p>
                <span className={`module-category ${metadata.category}`}>
                  {metadata.category === 'core' ? 'Essential' : 'Optional'}
                </span>
              </div>
            </div>
            
            <div className="module-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences[moduleKey] || false}
                  onChange={() => handleToggleModule(moduleKey)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="preferences-actions">
        <button 
          className="reset-btn" 
          onClick={handleReset}
          disabled={saving}
        >
          Reset to Defaults
        </button>
        <button 
          className="save-btn" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className="preferences-note">
        <p>💡 <strong>Note:</strong> Disabling a module will hide it from your dashboard and navigation, but your existing data will be preserved and can be restored anytime.</p>
      </div>
    </div>
  );
}

export default ModulePreferences;

