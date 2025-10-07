import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CycleTrackerPage from './CycleTrackerPage';
import PregnancyTrackerPage from './PregnancyTrackerPage';
import './Styles/MyCycle.css';
import Navbar from '../components/Navbar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

function MyCycle() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('cycle');
  const [viewMode, setViewMode] = useState('calendar'); // track active state for toggle UI
  const [pregnancyTrackingEnabled, setPregnancyTrackingEnabled] = useState(false);

  const setCycleViewMode = (mode) => {
    setViewMode(mode);
    // notify child cycle page to switch content
    window.dispatchEvent(new CustomEvent('cycle:setViewMode', { detail: mode }));
  };

  // Load pregnancy tracking setting
  useEffect(() => {
    const loadPregnancySetting = async () => {
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setPregnancyTrackingEnabled(data.pregnancyTrackingEnabled || false);
        }
      } catch (error) {
        console.error('Error loading pregnancy tracking setting:', error);
      }
    };

    loadPregnancySetting();
  }, [currentUser]);

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
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cycle'}
              className={activeTab === 'cycle' ? 'active' : ''}
              onClick={() => setActiveTab('cycle')}
            >
              Cycle Tracker
            </button>
            {pregnancyTrackingEnabled && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pregnancy'}
                className={activeTab === 'pregnancy' ? 'active' : ''}
                onClick={() => setActiveTab('pregnancy')}
              >
                Pregnancy Tracker
              </button>
            )}
          </div>
        </div>
        <div className="tab-content">
          {activeTab === 'cycle' && <CycleTrackerPage hideTopToggle />}
          {activeTab === 'pregnancy' && pregnancyTrackingEnabled && <PregnancyTrackerPage />}
        </div>
      </div>
    </>
  );
}

export default MyCycle;
