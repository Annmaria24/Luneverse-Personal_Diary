import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/MoodTrackerPage.css';
import { addMoodEntry, getMoodHistory } from "../services/moodService";
import { auth } from "../firebase/config";
import ProfileDropdown from '../components/ProfileDropdown';


function MoodTrackerPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());

  const moods = [
    { emoji: '😊', name: 'Happy', color: '#10b981', value: 5 },
    { emoji: '🥰', name: 'Loved', color: '#f59e0b', value: 5 },
    { emoji: '😌', name: 'Calm', color: '#06b6d4', value: 4 },
    { emoji: '😐', name: 'Neutral', color: '#6b7280', value: 3 },
    { emoji: '😔', name: 'Sad', color: '#3b82f6', value: 2 },
    { emoji: '😤', name: 'Frustrated', color: '#ef4444', value: 2 },
    { emoji: '😢', name: 'Crying', color: '#8b5cf6', value: 1 },
    { emoji: '😴', name: 'Tired', color: '#64748b', value: 2 },
    { emoji: '🤗', name: 'Grateful', color: '#84cc16', value: 5 },
    { emoji: '😰', name: 'Anxious', color: '#f97316', value: 1 }
  ];

  useEffect(() => {
    loadMoodHistory();
  }, [viewMode, selectedDate]);

  const loadMoodHistory = () => {
    // TODO: Implement Firebase integration
    // Mock data for demonstration
    const mockHistory = [
      {
        id: 1,
        date: new Date().toDateString(),
        mood: '😊',
        moodName: 'Happy',
        value: 5,
        note: 'Had a great day with friends!',
        timestamp: new Date()
      },
      {
        id: 2,
        date: new Date(Date.now() - 86400000).toDateString(),
        mood: '😌',
        moodName: 'Calm',
        value: 4,
        note: 'Peaceful morning meditation',
        timestamp: new Date(Date.now() - 86400000)
      }
    ];
    setMoodHistory(mockHistory);
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const handleSaveMood = () => {
    if (!selectedMood) return;

    const newMoodEntry = {
      id: Date.now(),
      date: selectedDate.toDateString(),
      mood: selectedMood.emoji,
      moodName: selectedMood.name,
      value: selectedMood.value,
      note: moodNote,
      timestamp: new Date()
    };

    setMoodHistory([newMoodEntry, ...moodHistory]);
    setSelectedMood('');
    setMoodNote('');
  };

  const getMoodAverage = () => {
    if (moodHistory.length === 0) return 0;
    const sum = moodHistory.reduce((acc, entry) => acc + entry.value, 0);
    return (sum / moodHistory.length).toFixed(1);
  };

  const getMoodStreak = () => {
    // Calculate consecutive days with mood entries
    return moodHistory.length; // Simplified for demo
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="mood-tracker-page">
      {/* Header */}
      <header className="mood-header">
        <button onClick={goBack} className="back-button">
          <span className="back-arrow">←</span>
          Dashboard
        </button>
        <h1>Mood Tracker</h1>
        <div className="header-right">
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
          <ProfileDropdown />
        </div>
      </header>

      <div className="mood-container">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Average Mood</h3>
              <p className="stat-value">{getMoodAverage()}/5</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>Tracking Streak</h3>
              <p className="stat-value">{getMoodStreak()} days</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Total Entries</h3>
              <p className="stat-value">{moodHistory.length}</p>
            </div>
          </div>
        </div>

        {/* Today's Mood Section */}
        <div className="mood-input-section">
          <div className="section-header">
            <h2>How are you feeling today?</h2>
            <p className="current-date">{formatDate(selectedDate)}</p>
          </div>

          <div className="mood-grid">
            {moods.map((mood) => (
              <button
                key={mood.name}
                onClick={() => handleMoodSelect(mood)}
                className={`mood-option ${selectedMood?.name === mood.name ? 'selected' : ''}`}
                style={{ '--mood-color': mood.color }}
              >
                <span className="mood-emoji">{mood.emoji}</span>
                <span className="mood-name">{mood.name}</span>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="mood-note-section">
              <label htmlFor="mood-note">What's making you feel {selectedMood.name.toLowerCase()}?</label>
              <textarea
                id="mood-note"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Share your thoughts (optional)..."
                className="mood-note-input"
                rows="3"
              />
              <div className="mood-actions">
                <button
                  onClick={() => {
                    setSelectedMood('');
                    setMoodNote('');
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button onClick={handleSaveMood} className="save-mood-btn">
                  Save Mood
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mood History */}
        <div className="mood-history-section">
          <h2>Mood History</h2>
          {moodHistory.length === 0 ? (
            <div className="no-history">
              <div className="no-history-icon">📊</div>
              <p>No mood entries yet.</p>
              <p>Start tracking to see your patterns!</p>
            </div>
          ) : (
            <div className="history-list">
              {moodHistory.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-mood">
                    <span className="history-emoji">{entry.mood}</span>
                    <div className="history-details">
                      <h4>{entry.moodName}</h4>
                      <p className="history-date">
                        {entry.timestamp.toLocaleDateString()} at{' '}
                        {entry.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {entry.note && (
                    <div className="history-note">
                      <p>"{entry.note}"</p>
                    </div>
                  )}
                  <div className="history-actions">
                    <button className="edit-history-btn">Edit</button>
                    <button className="delete-history-btn">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mood Insights */}
        <div className="mood-insights-section">
          <h2>Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h3>Most Common Mood</h3>
              <div className="insight-content">
                <span className="insight-emoji">😊</span>
                <span>Happy</span>
              </div>
            </div>
            <div className="insight-card">
              <h3>Best Day</h3>
              <div className="insight-content">
                <span className="insight-emoji">📅</span>
                <span>Monday</span>
              </div>
            </div>
            <div className="insight-card">
              <h3>Improvement</h3>
              <div className="insight-content">
                <span className="insight-emoji">📈</span>
                <span>+15% this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodTrackerPage;
