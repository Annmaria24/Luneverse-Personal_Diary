import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CycleTrackerPage from './CycleTrackerPage';
import PregnancyTrackerPage from './PregnancyTrackerPage';
import './Styles/MyCycle.css';
import Navbar from '../components/Navbar';
import { getUserSettings } from '../services/userService';

function MyCycle() {
  const { currentUser, modulePreferences } = useAuth();
  const [activeTab, setActiveTab] = useState('cycle');
  const [viewMode, setViewMode] = useState('calendar'); // track active state for toggle UI
  const [pregnancyTrackingEnabled, setPregnancyTrackingEnabled] = useState(false);

  const setCycleViewMode = (mode) => {
    setViewMode(mode);
    // notify child cycle page to switch content
    window.dispatchEvent(new CustomEvent('cycle:setViewMode', { detail: mode }));
    // also notify pregnancy page if it's active
    window.dispatchEvent(new CustomEvent('pregnancy:setViewMode', { detail: mode }));
  };

  // Load pregnancy tracking setting
  useEffect(() => {
    const loadPregnancySetting = async () => {
      if (!currentUser) return;

      try {
        const userSettings = await getUserSettings(currentUser.uid);
        setPregnancyTrackingEnabled(userSettings?.pregnancyTrackingEnabled || false);
      } catch (error) {
        console.error('Error loading pregnancy tracking setting:', error);
      }
    };

    loadPregnancySetting();
  }, [currentUser]);

  // Listen for module preferences updates
  useEffect(() => {
    const handlePreferencesUpdate = () => {
      const loadPregnancySetting = async () => {
        if (!currentUser) return;

        try {
          const userSettings = await getUserSettings(currentUser.uid);
          setPregnancyTrackingEnabled(userSettings?.pregnancyTrackingEnabled || false);
        } catch (error) {
          console.error('Error loading pregnancy tracking setting:', error);
        }
      };

      loadPregnancySetting();
    };

    window.addEventListener('modulePreferencesUpdated', handlePreferencesUpdate);

    return () => {
      window.removeEventListener('modulePreferencesUpdated', handlePreferencesUpdate);
    };
  }, [currentUser]);

  // Auto-switch to available tab if current tab is not enabled
  useEffect(() => {
    if (activeTab === 'cycle' && !modulePreferences.cycleTracker && modulePreferences.pregnancyTracker) {
      setActiveTab('pregnancy');
    } else if (activeTab === 'pregnancy' && !modulePreferences.pregnancyTracker && modulePreferences.cycleTracker) {
      setActiveTab('cycle');
    }
  }, [modulePreferences, activeTab]);

  return (
    <>
      <Navbar />
      <div className="my-cycle-page">
        <div className="dashboard-background">
          <div className="floating-element element-1">🌙</div>
          <div className="floating-element element-2">✨</div>
          <div className="floating-element element-3">🌸</div>
          <div className="floating-element element-4">💜</div>
          <div className="floating-element element-5">🦋</div>
          <div className="floating-element element-6">🌺</div>
        </div>
        <div className="page-toolbar">
          <div className="cycle-view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`cycle-view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setCycleViewMode('calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={`cycle-view-btn ${viewMode === 'insights' ? 'active' : ''}`}
              onClick={() => setCycleViewMode('insights')}
            >
              Insights
            </button>
          </div>
          <div className="tab-buttons floating" role="tablist" aria-label="Cycle tabs">
            {modulePreferences.cycleTracker && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cycle'}
                className={activeTab === 'cycle' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('cycle');
                  setViewMode('calendar'); // Reset to calendar view when switching tabs
                  // Notify child components of the view mode change
                  window.dispatchEvent(new CustomEvent('cycle:setViewMode', { detail: 'calendar' }));
                }}
              >
                Cycle Tracker
              </button>
            )}
            {modulePreferences.pregnancyTracker && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pregnancy'}
                className={activeTab === 'pregnancy' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('pregnancy');
                  setViewMode('calendar'); // Reset to calendar view when switching tabs
                  // Notify child components of the view mode change
                  window.dispatchEvent(new CustomEvent('pregnancy:setViewMode', { detail: 'calendar' }));
                }}
              >
                Pregnancy Tracker
              </button>
            )}
          </div>
        </div>
        <div className="tab-content">
          {activeTab === 'cycle' && modulePreferences.cycleTracker && <CycleTrackerPage hideTopToggle />}
          {activeTab === 'pregnancy' && modulePreferences.pregnancyTracker && <PregnancyTrackerPage />}
        </div>
      </div>
    </>
  );
}

export default MyCycle;
