import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Styles/MoodTrackerPage.css';
import {
  addMoodEntry,
  getMoodHistory,
  getMoodStats,
  updateMoodEntry,
  deleteMoodEntry,
  hasTodayMoodEntry
} from "../services/moodService";
import Navbar from '../components/Navbar';
import DonutChart from '../components/charts/DonutChart';


function MoodTrackerPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isNavigating, setIsNavigating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);
  const [hasEntryToday, setHasEntryToday] = useState(false);

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
    if (currentUser) {
      loadMoodData();
    }
  }, [currentUser, viewMode, selectedDate]);

  const loadMoodData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');

      // Load mood history
      const history = await getMoodHistory(currentUser.uid, {
        viewMode,
        selectedDate,
        limitCount: 50
      });
      setMoodHistory(history);

      // Load statistics
      const moodStats = await getMoodStats(currentUser.uid, viewMode, selectedDate);
      setStats(moodStats);

      // Check if user has entry for today
      const todayEntry = await hasTodayMoodEntry(currentUser.uid);
      setHasEntryToday(todayEntry);

    } catch (err) {
      console.error('Error loading mood data:', err);
      setError(`Failed to load mood data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !currentUser) return;

    try {
      setSaving(true);
      setError('');

      const moodData = {
        mood: selectedMood.emoji,
        moodName: selectedMood.name,
        value: selectedMood.value,
        note: moodNote.trim(),
        date: selectedDate.toISOString().split('T')[0]
      };

      if (editingEntry) {
        // Update existing entry
        await updateMoodEntry(editingEntry.id, moodData);
        setEditingEntry(null);
      } else {
        // Add new entry
        await addMoodEntry(currentUser.uid, moodData);
      }

      // Reset form
      setSelectedMood('');
      setMoodNote('');
      
      // Reload data
      await loadMoodData();

    } catch (err) {
      console.error('Error saving mood:', err);
      setError('Failed to save mood entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    const mood = moods.find(m => m.name === entry.moodName);
    setSelectedMood(mood);
    setMoodNote(entry.note || '');
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this mood entry?')) {
      return;
    }

    try {
      setError('');
      await deleteMoodEntry(entryId);
      await loadMoodData();
    } catch (err) {
      console.error('Error deleting mood entry:', err);
      setError('Failed to delete mood entry. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setSelectedMood('');
    setMoodNote('');
  };

  const getMoodAverage = () => {
    return stats.averageMood || 0;
  };

  const getMoodStreak = () => {
    return stats.streak || 0;
  };

  const getTotalEntries = () => {
    return stats.totalEntries || 0;
  };



  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mood-tracker-page">
        <Navbar />
        <div className="mood-container">
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Loading your mood data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mood-tracker-page">
      <Navbar />
      {/* View Toggle moved to navbar */}

      <div className="mood-container">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={() => setError('')} className="dismiss-error">×</button>
          </div>
        )}
        {/* View Toggle (moved under navbar) */}
        <div className="view-toggle" style={{margin:'12px 0', display:'inline-flex', background:'#f1f5f9', padding:'4px', borderRadius:'9999px', gap:'4px'}}>
          <button onClick={() => setViewMode('today')} className={`view-btn ${viewMode==='today'?'active':''}`}>Today</button>
          <button onClick={() => setViewMode('week')} className={`view-btn ${viewMode==='week'?'active':''}`}>Week</button>
          <button onClick={() => setViewMode('month')} className={`view-btn ${viewMode==='month'?'active':''}`}>Month</button>
        </div>

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
              <p className="stat-value">{getTotalEntries()}</p>
            </div>
          </div>
        </div>

        {/* Today's Mood Section */}
        <div className="mood-input-section">
          <div className="section-header">
            <h2>{editingEntry ? 'Edit Your Mood' : 'How are you feeling today?'}</h2>
            <p className="current-date">{formatDate(selectedDate)}</p>
            {hasEntryToday && !editingEntry && viewMode === 'today' && (
              <p className="entry-status">✅ You've already logged your mood today!</p>
            )}
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
                maxLength={500}
              />
              <div className="character-count">
                {moodNote.length}/500 characters
              </div>
              <div className="mood-actions">
                <button
                  onClick={editingEntry ? handleCancelEdit : () => {
                    setSelectedMood('');
                    setMoodNote('');
                  }}
                  className="cancel-btn"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveMood} 
                  className="save-mood-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading-spinner">⏳</span>
                      {editingEntry ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    editingEntry ? 'Update Mood' : 'Save Mood'
                  )}
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
                    <button 
                      className="edit-history-btn"
                      onClick={() => handleEditEntry(entry)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-history-btn"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      Delete
                    </button>
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
              <h3>Mood Distribution</h3>
              <DonutChart
                data={Object.entries(stats.moodDistribution || {}).map(([label, pct]) => ({
                  label,
                  value: parseFloat(pct),
                  color: (moods.find(m => m.name === label) || {}).color || '#8b5cf6'
                }))}
                innerRadiusPct={62}
                centerLabel={`n=${getTotalEntries()}`}
              />
            </div>
            <div className="insight-card">
              <h3>Weekly Trend</h3>
              <svg className="insights-chart" viewBox="0 0 300 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="moodLine" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                {(() => {
                  const points = (stats.weeklySeries || []).map((v, i) => {
                    const x = (i / Math.max(1,(stats.weeklySeries.length - 1))) * 300;
                    const y = 160 - (v / 5) * 140;
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <>
                      <polyline points={points} fill="none" stroke="url(#moodLine)" strokeWidth="3" />
                      {(stats.weeklySeries || []).map((v, i) => {
                        const x = (i / Math.max(1,(stats.weeklySeries.length - 1))) * 300;
                        const y = 160 - (v / 5) * 140;
                        return <circle key={i} cx={x} cy={y} r="3" fill="#8b5cf6" />;
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="insight-card">
              <h3>Mood Range</h3>
              <div className="insight-content">
                <span className="insight-emoji">🎯</span>
                <span>
                  {stats.averageMood ? `${stats.averageMood}/5.0` : 'No data'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoodTrackerPage;
