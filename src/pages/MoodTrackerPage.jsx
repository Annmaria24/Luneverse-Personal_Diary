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
import DonutChart from '../components/charts/DonutChart';


function MoodTrackerPage({ viewMode = 'today' }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [streak, setStreak] = useState(0);
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

  // Recalculate streak when moodHistory changes
  useEffect(() => {
    if (moodHistory.length > 0) {
      console.log('Mood history updated, recalculating streak:', moodHistory.length, 'entries');
      const newStreak = getMoodStreak();
      setStreak(newStreak);
    } else {
      setStreak(0);
    }
  }, [moodHistory]);

  const loadMoodData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');

      // Load mood history for current view
      const history = await getMoodHistory(currentUser.uid, {
        viewMode,
        selectedDate,
        limitCount: 50
      });
      setMoodHistory(history);

      // Load ALL mood history for streak calculation (regardless of view mode)
      // Use a simpler approach to avoid Firebase index issues
      let allHistory = [];
      try {
        allHistory = await getMoodHistory(currentUser.uid, {
          viewMode: 'all',
          limitCount: 100 // Get more entries for accurate streak
        });
      } catch (indexError) {
        console.warn('Index error for all history, using current history for streak:', indexError);
        // Fallback to using current history if index query fails
        allHistory = history;
      }

      // Load statistics
      const moodStats = await getMoodStats(currentUser.uid, viewMode, selectedDate);
      setStats(moodStats);

      // Check if user has entry for today
      const todayEntry = await hasTodayMoodEntry(currentUser.uid);
      setHasEntryToday(todayEntry);

      // Calculate streak using ALL history, not just current view
      console.log('🔍 Streak Debug Info:', {
        currentViewMode: viewMode,
        currentHistoryLength: history.length,
        allHistoryLength: allHistory.length,
        currentHistoryDates: history.map(h => new Date(h.timestamp).toDateString()),
        allHistoryDates: allHistory.map(h => new Date(h.timestamp).toDateString())
      });
      
      if (allHistory.length > 0) {
        // Use longest consecutive streak instead of current streak
        const longestStreak = findLongestConsecutiveStreakFromHistory(allHistory);
        console.log('📊 Longest streak calculated from all history:', longestStreak);
        setStreak(longestStreak);
      } else {
        console.log('📊 No all history available, setting streak to 0');
        setStreak(0);
      }

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

  const getMoodInsight = () => {
    const avgMood = stats.averageMood || 0;
    const totalEntries = stats.totalEntries || 0;
    
    // Show insight even with 1 entry
    if (totalEntries === 0) {
      return 'Start tracking';
    }
    
    // Analyze mood level and provide professional insights
    if (avgMood >= 4.0) {
      return 'Thriving';
    } else if (avgMood >= 3.0) {
      return 'Positive';
    } else if (avgMood >= 2.0) {
      return 'Stable';
    } else {
      return 'Challenging';
    }
  };

  const getMoodStreak = () => {
    return getMoodStreakFromHistory(moodHistory);
  };

  const getMoodStreakFromHistory = (history) => {
    if (history.length === 0) return 0;
    
    // Sort by date (most recent first)
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create a set of dates that have mood entries
    const entryDates = new Set();
    const entryDatesList = []; // For debugging
    
    sortedHistory.forEach(entry => {
      // Handle both timestamp formats (Date object or number)
      let entryDate;
      if (entry.timestamp instanceof Date) {
        entryDate = new Date(entry.timestamp);
      } else if (typeof entry.timestamp === 'number') {
        entryDate = new Date(entry.timestamp);
      } else if (entry.timestamp && entry.timestamp.toDate) {
        // Firestore timestamp
        entryDate = entry.timestamp.toDate();
      } else {
        entryDate = new Date(entry.timestamp);
      }
      
      entryDate.setHours(0, 0, 0, 0);
      const timeKey = entryDate.getTime();
      entryDates.add(timeKey);
      entryDatesList.push({
        original: entry.timestamp,
        processed: entryDate.toDateString(),
        timeKey: timeKey
      });
    });
    
    // Enhanced debug logging
    console.log('🔍 Enhanced Mood Streak Calculation:', {
      totalEntries: history.length,
      today: today.toDateString(),
      todayTimeKey: today.getTime(),
      entryDatesList: entryDatesList,
      entryDatesSet: Array.from(entryDates).map(time => ({
        timeKey: time,
        dateString: new Date(time).toDateString()
      })),
      hasToday: entryDates.has(today.getTime()),
      hasYesterday: entryDates.has(new Date(today.getTime() - 24*60*60*1000).getTime()),
      hasDayBeforeYesterday: entryDates.has(new Date(today.getTime() - 2*24*60*60*1000).getTime()),
      // Additional debugging
      rawHistory: history.map(h => ({
        id: h.id,
        timestamp: h.timestamp,
        timestampType: typeof h.timestamp,
        date: new Date(h.timestamp).toDateString()
      }))
    });
    
    // Check consecutive days starting from today
    let currentDate = new Date(today);
    let consecutiveDays = [];
    
    while (entryDates.has(currentDate.getTime())) {
      streak++;
      consecutiveDays.push(currentDate.toDateString());
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    console.log('📊 Consecutive days found:', consecutiveDays);
    console.log('📊 Streak from today:', streak);
    console.log('📊 Today is:', today.toDateString());
    console.log('📊 Checking consecutive days from today backwards...');
    
    // If we have entries but no streak from today, check if yesterday has an entry
    // This handles cases where user logged mood yesterday but not today yet
    if (streak === 0 && entryDates.size > 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (entryDates.has(yesterday.getTime())) {
        console.log('📊 No streak from today, checking from yesterday...');
        // Count consecutive days from yesterday
        currentDate = new Date(yesterday);
        consecutiveDays = [];
        
        while (entryDates.has(currentDate.getTime())) {
          streak++;
          consecutiveDays.push(currentDate.toDateString());
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        console.log('📊 Consecutive days from yesterday:', consecutiveDays);
      }
    }
    
    console.log('✅ Final calculated streak:', streak);
    
    // Additional debugging - show what dates we actually have
    console.log('📅 All available dates in database:', 
      Array.from(entryDates).map(time => new Date(time).toDateString()).sort()
    );
    
    // Find the longest consecutive streak in the data (not just from today)
    const longestStreak = findLongestConsecutiveStreak(Array.from(entryDates));
    console.log('🏆 Longest consecutive streak in data:', longestStreak);
    
    return streak;
  };

  const getTotalEntries = () => {
    return stats.totalEntries || 0;
  };

  // Helper function to find the longest consecutive streak in the data
  const findLongestConsecutiveStreak = (dateTimeKeys) => {
    if (dateTimeKeys.length === 0) return 0;
    
    // Convert time keys to dates and sort them
    const dates = dateTimeKeys
      .map(time => new Date(time))
      .sort((a, b) => a - b);
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1];
      const currentDate = dates[i];
      const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        // Consecutive day
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        // Not consecutive, reset streak
        currentStreak = 1;
      }
    }
    
    console.log('🔍 Longest streak analysis:', {
      totalDates: dates.length,
      dates: dates.map(d => d.toDateString()),
      maxStreak: maxStreak
    });
    
    return maxStreak;
  };

  // New function to find longest consecutive streak from mood history
  const findLongestConsecutiveStreakFromHistory = (history) => {
    if (history.length === 0) return 0;
    
    // Extract and process dates from history
    const entryDates = new Set();
    
    history.forEach(entry => {
      let entryDate;
      if (entry.timestamp instanceof Date) {
        entryDate = new Date(entry.timestamp);
      } else if (typeof entry.timestamp === 'number') {
        entryDate = new Date(entry.timestamp);
      } else if (entry.timestamp && entry.timestamp.toDate) {
        entryDate = entry.timestamp.toDate();
      } else {
        entryDate = new Date(entry.timestamp);
      }
      
      entryDate.setHours(0, 0, 0, 0);
      entryDates.add(entryDate.getTime());
    });
    
    // Convert to sorted dates
    const dates = Array.from(entryDates)
      .map(time => new Date(time))
      .sort((a, b) => a - b);
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    console.log('🔍 Finding longest consecutive streak from dates:', dates.map(d => d.toDateString()));
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1];
      const currentDate = dates[i];
      const dayDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        // Consecutive day
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
        console.log(`✅ Consecutive: ${prevDate.toDateString()} → ${currentDate.toDateString()} (streak: ${currentStreak})`);
      } else {
        // Not consecutive, reset streak
        console.log(`❌ Gap: ${prevDate.toDateString()} → ${currentDate.toDateString()} (${dayDiff} days gap, reset streak)`);
        currentStreak = 1;
      }
    }
    
    console.log('🏆 Longest consecutive streak found:', maxStreak);
    return maxStreak;
  };

  const handleGraphClick = () => {
    setShowGraphModal(true);
  };

  const closeGraphModal = () => {
    setShowGraphModal(false);
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
      <div className="dashboard-background" style={{zIndex: 1}}>
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
        <div className="floating-element element-6">🌺</div>
      </div>
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


        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Average Mood</h3>
              <p className="stat-value">{getMoodAverage().toFixed(1)}/5</p>
              <p className="mood-insight-text">{getMoodInsight()}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>Tracking Streak</h3>
              <p className="stat-value">{streak} days</p>
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
                        {entry.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
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
          <h2>Mood Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="card-icon">📊</div>
              <h3>Current {viewMode === 'today' ? 'Day' : viewMode === 'week' ? 'Week' : 'Month'}</h3>
              <span className="mood-score">
                {stats.averageMood ? `${stats.averageMood.toFixed(1)}/5` : 'No data'}
              </span>
              <p className="mood-insight-text">{getMoodInsight()}</p>
            </div>
            
            <div className="insight-card clickable-card" onClick={handleGraphClick}>
              <div className="card-icon">📈</div>
              <h3>Mood Trend</h3>
              {(() => {
                  // Get appropriate data based on view mode
                  let series = [];
                  let timeLabel = '';
                  
                  if (viewMode === 'today') {
                    // For today, show hourly data if available, otherwise show the single entry
                    const todayEntries = moodHistory.filter(entry => {
                      const entryDate = new Date(entry.timestamp);
                      const today = new Date();
                      return entryDate.toDateString() === today.toDateString();
                    });
                    
                    if (todayEntries.length === 0) {
                      return (
                        <div className="no-data-chart">
                          <p>No data today</p>
                        </div>
                      );
                    }
                    
                    // Create hourly series for today
                    series = Array(24).fill(0);
                    todayEntries.forEach(entry => {
                      const hour = new Date(entry.timestamp).getHours();
                      series[hour] = entry.value;
                    });
                    timeLabel = 'Today (24h)';
                  } else if (viewMode === 'week') {
                    series = stats.weeklySeries || [];
                    timeLabel = 'This Week';
                  } else {
                    series = stats.monthlySeries || [];
                    timeLabel = 'This Month';
                  }
                  
                const hasData = series.some(v => v > 0);
                if (!hasData) {
                  return (
                    <div className="no-data-chart">
                        <p>No data {timeLabel.toLowerCase()}</p>
                    </div>
                  );
                }
                  
                const points = series.map((v, i) => {
                  const x = (i / Math.max(1, series.length - 1)) * 300;
                  const y = 160 - (v / 5) * 120;
                  return `${x},${y}`;
                }).join(' ');
                  
                return (
                    <div className="chart-container">
                      <div className="chart-label">{timeLabel}</div>
                      <svg 
                        className="insights-chart" 
                        viewBox="0 0 300 180" 
                        preserveAspectRatio="none"
                      >
                    <defs>
                          <linearGradient id="moodArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                          </linearGradient>
                          <linearGradient id="moodLine" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="50%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                        
                        {/* Grid lines */}
                        <g opacity="0.2">
                          {[1, 2, 3, 4, 5].map(level => {
                            const y = 160 - (level / 5) * 120;
                            return (
                              <line key={level} x1="0" y1={y} x2="300" y2={y} stroke="#8b5cf6" strokeWidth="0.5" />
                            );
                          })}
                        </g>
                        
                        {/* Area under curve */}
                        <polygon 
                          points={`0,160 ${points} 300,160`} 
                          fill="url(#moodArea)" 
                        />
                        
                        {/* Main line */}
                        <polyline 
                          points={points} 
                          fill="none" 
                          stroke="url(#moodLine)" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                    {series.map((v, i) => {
                          if (v > 0) {
                      const x = (i / Math.max(1, series.length - 1)) * 300;
                      const y = 160 - (v / 5) * 120;
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="url(#moodLine)" strokeWidth="2" />
                                <circle cx={x} cy={y} r="2" fill="url(#moodLine)" />
                              </g>
                            );
                          }
                          return null;
                        })}
                        
                        {/* Y-axis labels */}
                        <g fontSize="10" fill="#6b7280" textAnchor="end">
                          {[1, 2, 3, 4, 5].map(level => {
                            const y = 160 - (level / 5) * 120;
                            return (
                              <text key={level} x="-5" y={y + 3}>
                                {level}
                              </text>
                            );
                          })}
                        </g>
                  </svg>
                    </div>
                );
              })()}
            </div>
            
          </div>
        </div>

        {/* Graph Modal */}
        {showGraphModal && (
          <div className="graph-modal-overlay" onClick={closeGraphModal}>
            <div className="graph-modal" onClick={(e) => e.stopPropagation()}>
              <div className="graph-modal-header">
                <h3>Detailed Mood Trend - {viewMode === 'today' ? 'Today' : viewMode === 'week' ? 'This Week' : 'This Month'}</h3>
                <button className="close-modal-btn" onClick={closeGraphModal}>×</button>
              </div>
              <div className="graph-modal-content">
                {(() => {
                  let series = [];
                  let timeLabel = '';
                  
                  if (viewMode === 'today') {
                    const todayEntries = moodHistory.filter(entry => {
                      const entryDate = new Date(entry.timestamp);
                      const today = new Date();
                      return entryDate.toDateString() === today.toDateString();
                    });
                    
                    if (todayEntries.length === 0) {
                      return (
                        <div className="no-data-chart">
                          <p>No data today</p>
                        </div>
                      );
                    }
                    
                    series = Array(24).fill(0);
                    todayEntries.forEach(entry => {
                      const hour = new Date(entry.timestamp).getHours();
                      series[hour] = entry.value;
                    });
                    timeLabel = 'Today (24h)';
                  } else if (viewMode === 'week') {
                    series = stats.weeklySeries || [];
                    timeLabel = 'This Week';
                  } else {
                    series = stats.monthlySeries || [];
                    timeLabel = 'This Month';
                  }
                  
                  const hasData = series.some(v => v > 0);
                  if (!hasData) {
                    return (
                      <div className="no-data-chart">
                        <p>No data {timeLabel.toLowerCase()}</p>
                      </div>
                    );
                  }
                  
                  const points = series.map((v, i) => {
                    const x = 60 + (i / Math.max(1, series.length - 1)) * 590;
                    const y = 320 - (v / 5) * 280;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return (
                    <div className="modal-chart-container">
                      <div className="modal-chart-header">
                        <div className="modal-chart-label">{timeLabel}</div>
                        <div className="mood-scale-info">
                          <span className="scale-label">Mood Scale:</span>
                          <span className="scale-range">1 = Very Low, 5 = Excellent</span>
                        </div>
                      </div>
                      
                      <div className="chart-legend">
                        <div className="legend-item">
                          <div className="legend-color" style={{background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #06b6d4)'}}></div>
                          <span>Mood Trend</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-dot"></div>
                          <span>Data Points</span>
                        </div>
                      </div>
                      
                      <svg className="modal-chart" viewBox="0 0 700 350" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="modalMoodArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                          </linearGradient>
                          <linearGradient id="modalMoodLine" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="50%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                        
                        {/* Y-axis line */}
                        <line x1="60" y1="20" x2="60" y2="320" stroke="#e5e7eb" strokeWidth="2" />
                        
                        {/* X-axis line */}
                        <line x1="50" y1="320" x2="650" y2="320" stroke="#e5e7eb" strokeWidth="2" />
                        
                        {/* Grid lines */}
                        <g opacity="0.4">
                          {[1, 2, 3, 4, 5].map(level => {
                            const y = 320 - (level / 5) * 280;
                            return (
                              <line key={level} x1="60" y1={y} x2="650" y2={y} stroke="#8b5cf6" strokeWidth="1" />
                            );
                          })}
                        </g>
                        
                        {/* Area under curve */}
                        <polygon 
                          points={`60,320 ${points} 650,320`} 
                          fill="url(#modalMoodArea)" 
                        />
                        
                        {/* Main line */}
                        <polyline 
                          points={points} 
                          fill="none" 
                          stroke="url(#modalMoodLine)" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points with tooltips */}
                        {series.map((v, i) => {
                          if (v > 0) {
                            const x = 60 + (i / Math.max(1, series.length - 1)) * 590;
                            const y = 320 - (v / 5) * 280;
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r="8" fill="#ffffff" stroke="url(#modalMoodLine)" strokeWidth="3" />
                                <circle cx={x} cy={y} r="4" fill="url(#modalMoodLine)" />
                                <text x={x} y={y - 20} textAnchor="middle" fontSize="14" fill="#374151" fontWeight="bold">
                                  {v.toFixed(1)}
                                </text>
                              </g>
                            );
                          }
                          return null;
                        })}
                        
                        {/* Y-axis labels with mood descriptions */}
                        <g fontSize="12" fill="#6b7280" textAnchor="end">
                          {[
                            {level: 1, desc: "Very Low"},
                            {level: 2, desc: "Low"},
                            {level: 3, desc: "Moderate"},
                            {level: 4, desc: "Good"},
                            {level: 5, desc: "Excellent"}
                          ].map(({level, desc}) => {
                            const y = 320 - (level / 5) * 280;
                            return (
                              <g key={level}>
                                <text x="40" y={y + 4} fontSize="14" fontWeight="bold" fill="#374151">
                                  {level}
                                </text>
                                <text x="40" y={y + 18} fontSize="10" fill="#6b7280">
                                  {desc}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                        
                        {/* X-axis labels for time periods */}
                        <g fontSize="12" fill="#6b7280" textAnchor="middle">
                          {series.map((v, i) => {
                            if (i % Math.ceil(series.length / 8) === 0 || i === series.length - 1) {
                              const x = 60 + (i / Math.max(1, series.length - 1)) * 590;
                              let label = '';
                              if (viewMode === 'today') {
                                label = `${i}:00`;
                              } else if (viewMode === 'week') {
                                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                label = days[i % 7];
                              } else {
                                label = `Week ${i + 1}`;
                              }
                              return (
                                <text key={i} x={x} y="340" fontSize="12" fontWeight="500">
                                  {label}
                                </text>
                              );
                            }
                            return null;
                          })}
                        </g>
                        
                        {/* Axis titles */}
                        <text x="350" y="360" textAnchor="middle" fontSize="14" fontWeight="600" fill="#374151">
                          {viewMode === 'today' ? 'Time (Hours)' : viewMode === 'week' ? 'Days of Week' : 'Weeks'}
                        </text>
                        <text x="10" y="170" textAnchor="middle" fontSize="14" fontWeight="600" fill="#374151" transform="rotate(-90, 10, 170)">
                          Mood Level
                        </text>
                      </svg>
                      
                      <div className="chart-summary">
                        <div className="summary-item">
                          <span className="summary-label">Average Mood:</span>
                          <span className="summary-value">{series.filter(v => v > 0).reduce((a, b) => a + b, 0) / series.filter(v => v > 0).length || 0}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Data Points:</span>
                          <span className="summary-value">{series.filter(v => v > 0).length}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Trend:</span>
                          <span className="summary-value">
                            {series.filter(v => v > 0).length > 1 ? 
                              (series[series.length - 1] > series[0] ? '↗ Improving' : 
                               series[series.length - 1] < series[0] ? '↘ Declining' : '→ Stable') : 
                              'Single Entry'}
                </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodTrackerPage;
