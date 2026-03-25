import { useState } from 'react';
import DiaryPage from './DiaryPage';
import MoodTrackerPage from './MoodTrackerPage';
import './Styles/MyJournal.css';
import Navbar from '../components/Navbar';

function MyJournal() {
  const [activeTab, setActiveTab] = useState('diary');
  const [viewMode, setViewMode] = useState('today');

  return (
    <>
      <Navbar />
      <div className="my-journal-page">
        <div className="dashboard-background" style={{ zIndex: 1 }}>
          <div className="floating-element element-1">🌙</div>
          <div className="floating-element element-2">✨</div>
          <div className="floating-element element-3">🌸</div>
          <div className="floating-element element-4">💜</div>
          <div className="floating-element element-5">🦋</div>
          <div className="floating-element element-6">🌺</div>
        </div>

        <div className="page-toolbar">
          {activeTab === 'mood' && (
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('today')}
                className={`view-btn ${viewMode === 'today' ? 'active' : ''}`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              >
                Month
              </button>
            </div>
          )}

          <div className="tab-buttons floating" role="tablist" aria-label="Journal tabs">
            <button
              type="button"
              className={`view-btn ${activeTab === 'diary' ? 'active' : ''}`}
              onClick={() => setActiveTab('diary')}
              data-tab="diary"
            >
              Diary
            </button>

            <button
              type="button"
              className={`view-btn ${activeTab === 'mood' ? 'active' : ''}`}
              onClick={() => setActiveTab('mood')}
              data-tab="mood"
            >
              Mood Tracker
            </button>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'diary' && <DiaryPage includeNavbar={false} />}
          {activeTab === 'mood' && <MoodTrackerPage viewMode={viewMode} includeNavbar={false} />}
        </div>
      </div>
    </>
  );
}

export default MyJournal;
