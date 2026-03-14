import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Styles/MoodTrackerPage.css';
import {
  addMoodEntry,
  getMoodHistory,
  getMoodStats,
  updateMoodEntry,
  deleteMoodEntry,
  hasTodayMoodEntry,
  getAggregatedMoodCounts,
  getEmotionalTrendData,
  getUnifiedEmotionalStats
} from "../services/moodService";
import { generateEmotionalInsight } from "../services/aiMoodService";
import MoodLineChart from '../components/charts/MoodLineChart';


function MoodTrackerPage({ viewMode = 'today' }) {
  const { currentUser } = useAuth();
  const [selectedMood, setSelectedMood] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [streak, setStreak] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);
  const [hasEntryToday, setHasEntryToday] = useState(false);
  const [aggregatedMoodData, setAggregatedMoodData] = useState({
    moodCounts: { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 },
    totalEntries: 0,
    dataPoints: []
  });
  const [emotionalTrendData, setEmotionalTrendData] = useState({
    dataPoints: [],
    totalEntries: 0,
    rawPoints: []
  });
  const [unifiedBalance, setUnifiedBalance] = useState({
    averageScore: 0,
    label: 'Balanced',
    color: '#6b7280'
  });
  const [aiInsight, setAiInsight] = useState('');
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

  // Generate textual insight for mood distribution
  const getMoodDistributionInsight = () => {
    const { moodCounts } = aggregatedMoodData;
    const total = aggregatedMoodData.totalEntries;

    if (total === 0) return 'No mood data available for this period.';

    // Sort moods by count descending
    const sortedMoods = Object.entries(moodCounts)
      .filter(([mood, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedMoods.length === 0) return 'No mood data available for this period.';

    const [dominantMood, dominantCount] = sortedMoods[0];
    const timePeriod = viewMode === 'today' ? 'today' : viewMode === 'week' ? 'week' : 'month';

    let insight = `This ${timePeriod} your dominant mood was ${dominantMood} (${dominantCount} ${dominantCount === 1 ? 'entry' : 'entries'})`;

    if (sortedMoods.length > 1) {
      const [secondMood, secondCount] = sortedMoods[1];
      insight += ` followed by ${secondMood} (${secondCount} ${secondCount === 1 ? 'entry' : 'entries'})`;
    }

    if (sortedMoods.length > 2) {
      const remaining = sortedMoods.slice(2).reduce((sum, [, count]) => sum + count, 0);
      if (remaining > 0) {
        insight += ` and ${remaining} other ${remaining === 1 ? 'entry' : 'entries'}`;
      }
    }

    insight += '.';

    return insight;
  };

  // Generate compact statistical summary for small datasets
  const getCompactMoodSummary = () => {
    const { moodCounts } = aggregatedMoodData;
    const total = aggregatedMoodData.totalEntries;

    if (total === 0) return 'No mood data available for this period.';

    // Sort moods by count descending
    const sortedMoods = Object.entries(moodCounts)
      .filter(([mood, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedMoods.length === 0) return 'No mood data available for this period.';

    const [dominantMood, dominantCount] = sortedMoods[0];
    const timePeriod = viewMode === 'today' ? 'today' : viewMode === 'week' ? 'week' : 'month';

    // Create mood counts string
    const moodCountsString = sortedMoods
      .map(([mood, count]) => `${mood}: ${count}`)
      .join(', ');

    return {
      totalEntries: total,
      dominantMood,
      moodCountsString,
      timePeriod
    };
  };

  // Generate AI-powered emotional insight
  const generateAIInsight = async () => {
    const summary = getCompactMoodSummary();
    if (typeof summary === 'string') return; // No data case

    setAiInsightLoading(true);
    try {
      // Use "Monthly" for month view, otherwise use the timePeriod from summary
      const timePeriodForAPI = viewMode === 'month' ? 'Monthly' : summary.timePeriod;

      const result = await generateEmotionalInsight(
        summary.totalEntries,
        aggregatedMoodData.moodCounts,
        summary.dominantMood,
        timePeriodForAPI,
        { dataPoints: emotionalTrendData.dataPoints }
      );
      setAiInsight(result.insight);
    } catch (error) {
      console.error('Failed to generate AI insight:', error);
      // Fallback to static interpretation
      const moodVariety = Object.entries(aggregatedMoodData.moodCounts).filter(([mood, count]) => count > 0).length;
      let interpretation = '';
      if (moodVariety === 1) {
        interpretation = `You've been consistently feeling ${summary.dominantMood.toLowerCase()} throughout this ${summary.timePeriod}.`;
      } else {
        interpretation = `You've experienced a mix of moods this ${summary.timePeriod}, with ${summary.dominantMood.toLowerCase()} being most common.`;
      }
      setAiInsight(interpretation);
    } finally {
      setAiInsightLoading(false);
    }
  };

  const getTrendInsightMessage = () => {
    const points = emotionalTrendData.dataPoints;
    if (points.length < 2) return null;

    const firstMood = points[0].y;
    const lastMood = points[points.length - 1].y;

    // Check for large fluctuations (any change >= 1.5 points between steps or max-min >= 2.5)
    let maxStepChange = 0;
    let minVal = points[0].y;
    let maxVal = points[0].y;

    for (let i = 1; i < points.length; i++) {
      maxStepChange = Math.max(maxStepChange, Math.abs(points[i].y - points[i - 1].y));
      minVal = Math.min(minVal, points[i].y);
      maxVal = Math.max(maxVal, points[i].y);
    }

    const timeFrame = viewMode === 'today' ? 'day' : 'period';

    if (maxStepChange >= 2.0 || (maxVal - minVal) >= 3.0) {
      return `Your emotions shifted several times this ${timeFrame}. That’s natural—our feelings can change as we experience different moments.`;
    }

    if (lastMood > firstMood + 0.5) {
      return `Your mood appears to have improved throughout the ${timeFrame}. Small positive moments can gradually lift your emotional state.`;
    } else if (lastMood < firstMood - 0.5) {
      return `Your mood dipped during the ${timeFrame}. It might help to pause, breathe, and give yourself some gentle care.`;
    } else {
      return `Your emotional state has remained fairly steady this ${timeFrame}. Maintaining balance is a good sign of emotional awareness.`;
    }
  };

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

  // Mood colors for final categories
  const moodColors = {
    Happy: '#10b981',
    Sad: '#3b82f6',
    Angry: '#ef4444',
    Stressed: '#f97316',
    Calm: '#06b6d4',
    Neutral: '#6b7280'
  };

  useEffect(() => {
    if (currentUser) {
      loadMoodData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodHistory]);

  // Generate AI insight when aggregated mood data or trend data changes (monthly view only)
  useEffect(() => {
    if (viewMode === 'month' && aggregatedMoodData.totalEntries > 0) {
      generateAIInsight();
    } else {
      setAiInsight('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregatedMoodData, emotionalTrendData, viewMode]);

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

      // Load aggregated mood counts (combining moodEntries + diaryEntries with finalMood)
      const aggregatedData = await getAggregatedMoodCounts(currentUser.uid, viewMode, selectedDate);
      setAggregatedMoodData(aggregatedData);

      // Load emotional trend data for time-series line graph
      const trendData = await getEmotionalTrendData(currentUser.uid, viewMode, selectedDate);
      setEmotionalTrendData(trendData);

      // Load unified emotional balance for dashboard/stats
      const balanceData = await getUnifiedEmotionalStats(currentUser.uid, viewMode, selectedDate);
      setUnifiedBalance(balanceData);

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

      console.log(`🚀 [Mood Tracker] Initiating save for: ${selectedMood.name}`);

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
      console.error('❌ Error saving mood:', err);
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
    return unifiedBalance.averageScore || 0;
  };

  const getMoodInsight = () => {
    const avgMood = unifiedBalance.averageScore || 0;
    const totalEntries = stats.totalEntries || 0;

    // Show insight even with 1 entry
    if (totalEntries === 0) {
      return 'Start tracking';
    }

    return unifiedBalance.label;
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
      hasYesterday: entryDates.has(new Date(today.getTime() - 24 * 60 * 60 * 1000).getTime()),
      hasDayBeforeYesterday: entryDates.has(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).getTime()),
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
      <div className="dashboard-background" style={{ zIndex: 1 }}>
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
              <h3>Emotional Balance</h3>
              <p className="stat-value" style={{ color: unifiedBalance.color }}>
                {unifiedBalance.label}
              </p>
              <p className="mood-insight-text">Weighted Avg: {unifiedBalance.averageScore}/5</p>
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
                {unifiedBalance.averageScore ? `${unifiedBalance.averageScore.toFixed(1)}/5` : 'No data'}
              </span>
              <p className="mood-insight-text">{getMoodInsight()}</p>
            </div>

            <div className="insight-card clickable-card" onClick={handleGraphClick}>
              <div className="card-icon">�</div>
              <h3>Emotional Trends</h3>

              {emotionalTrendData.totalEntries === 0 ? (
                <div className="no-data-chart">
                  <p>No emotional data for this period</p>
                </div>
              ) : (
                <>
                  <div className="chart-preview-container">
                    <MoodLineChart
                      dataPoints={emotionalTrendData.dataPoints}
                      size={110}
                      showYLabels={false}
                      showXLabels={false}
                    />
                    <div className="chart-click-hint">Click for full analysis</div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Graph Modal */}
        {showGraphModal && (
          <div className="graph-modal-overlay" onClick={closeGraphModal}>
            <div className="graph-modal" onClick={(e) => e.stopPropagation()}>
              <div className="graph-modal-header">
                <h3>Emotional Trends - {viewMode === 'today' ? 'Today' : viewMode === 'week' ? 'This Week' : 'This Month'}</h3>
                <div className="point-count-info" style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto', marginRight: '20px' }}>
                  {emotionalTrendData.dataPoints.length} Interpreted Points
                </div>
                <button className="close-modal-btn" onClick={closeGraphModal}>×</button>
              </div>
              <div className="graph-modal-content">
                <div className="modal-chart-container">
                  <div className="modal-chart-label">Emotional Trends - {viewMode === 'today' ? 'Today' : viewMode === 'week' ? 'This Week' : 'This Month'}</div>
                  {emotionalTrendData.totalEntries === 0 ? (
                    <div className="no-data-chart">
                      <p>No emotional data for this period</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                        <MoodLineChart
                          dataPoints={emotionalTrendData.dataPoints}
                          size={300}
                          showYLabels={true}
                        />
                      </div>

                      {/* Emotional Progression Insight */}
                      {getTrendInsightMessage() && (
                        <div className="trend-insight-container" style={{ margin: '15px auto', maxWidth: '80%' }}>
                          <p className="trend-progression-msg">{getTrendInsightMessage()}</p>
                        </div>
                      )}

                      {viewMode === 'month' ? (
                        <div className="mood-insight-text mood-ai-insight" style={{ marginTop: '12px' }}>
                          {aiInsightLoading ? (
                            <span className="loading-insight">Generating insight...</span>
                          ) : (
                            aiInsight
                          )}
                        </div>
                      ) : (
                        <p className="mood-insight-text" style={{ marginTop: '12px' }}>{getMoodDistributionInsight()}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodTrackerPage;
