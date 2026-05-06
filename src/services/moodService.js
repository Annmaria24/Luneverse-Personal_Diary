import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  startAfter,
  Timestamp
} from "firebase/firestore";
import { getErrorMessage } from "../utils/errorMessages";
import { updateDailySummary } from "./wellnessService";

const moodRef = collection(db, "moodEntries");

// Add a new mood entry
export const addMoodEntry = async (userId, moodData) => {
  try {
    const { mood, moodName, value, note = "", date } = moodData;
    console.log("📊 [Interpretation Pipeline] Processing manual mood entry...");

    // Validate required fields
    if (!mood || !moodName || value === undefined) {
      throw new Error("Missing required mood data");
    }

    // Step 2: Recalculate or confirm interpretation if a note exists
    const { classifyMood } = await import('./aiMoodService');
    const interpretation = await classifyMood(note, moodName);

    console.log(`🧠 [Interpretation Pipeline] Unified Analysis:`, {
      manualMood: moodName,
      noteAnalysis: note ? "Processing note..." : "No note provided",
      finalInterpretedMood: interpretation.finalMood,
      confidence: interpretation.confidence
    });

    const docRef = await addDoc(moodRef, {
      userId,
      mood,
      moodName,
      value,
      note,
      finalMood: interpretation.finalMood, // Store the interpreted category
      interpretationScore: interpretation.confidence,
      date: date || new Date().toISOString().split("T")[0],
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
    });

    console.log("✅ [Interpretation Pipeline] Entry stored with ID:", docRef.id);
    
    // Aggregate for daily summary
    const entryDate = date || new Date().toISOString().split("T")[0];
    await updateDailySummary(userId, entryDate);
    
    window.dispatchEvent(new Event('dashboardDataUpdated'));

    return docRef;
  } catch (error) {
    console.error("❌ [Interpretation Pipeline] Error:", error);
    const userFriendlyMessage = getErrorMessage(error);
    const friendlyError = new Error(userFriendlyMessage);
    friendlyError.code = error.code;
    friendlyError.originalError = error;
    throw friendlyError;
  }
};

// Get mood history with filtering options
export const getMoodHistory = async (userId, options = {}) => {
  try {
    const {
      viewMode = 'all',
      selectedDate = new Date(),
      limitCount = 50,
      lastDoc = null
    } = options;

    // Start with basic query - simplified to avoid index issues
    let q;

    if (viewMode === 'all') {
      // Use simpler query to avoid index issues
      q = query(
        moodRef,
        where("userId", "==", userId)
      );
    } else {
      // For filtered views, use simpler query first
      q = query(
        moodRef,
        where("userId", "==", userId)
      );
    }

    // Add pagination
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    let results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));

    // Always sort by timestamp descending (client-side)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply client-side filtering for date ranges if needed
    if (viewMode !== 'all') {
      const { startDate, endDate } = getDateRange(viewMode, selectedDate);
      results = results.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    // Apply limit
    if (limitCount && results.length > limitCount) {
      results = results.slice(0, limitCount);
    }

    return results;
  } catch (error) {
    console.error("Error fetching mood history:", error);

    // If it's a permission error, return empty array instead of throwing
    if (error.code === 'permission-denied') {
      console.warn("Permission denied - Check Firestore security rules.");
      return [];
    }

    const userFriendlyMessage = getErrorMessage(error);
    const friendlyError = new Error(userFriendlyMessage);
    friendlyError.code = error.code;
    friendlyError.originalError = error;
    throw friendlyError;
  }
};

// Update an existing mood entry
export const updateMoodEntry = async (entryId, updateData) => {
  try {
    const entryRef = doc(db, "moodEntries", entryId);
    const entryDoc = await getDoc(entryRef);
    const entryDate = entryDoc.data()?.date;

    await updateDoc(entryRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });

    if (entryDate) {
      await updateDailySummary(entryDoc.data().userId, entryDate);
    }

    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));
  } catch (error) {
    console.error("Error updating mood entry:", error);
    throw error;
  }
};

// Delete a mood entry
export const deleteMoodEntry = async (entryId) => {
  try {
    const entryRef = doc(db, "moodEntries", entryId);
    const entryDoc = await getDoc(entryRef);
    if (entryDoc.exists()) {
      const { userId, date } = entryDoc.data();
      await deleteDoc(entryRef);
      if (date) await updateDailySummary(userId, date);
    }

    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));
  } catch (error) {
    console.error("Error deleting mood entry:", error);
    throw error;
  }
};

export const getMoodStats = async (userId, viewMode = 'month', selectedDate = new Date()) => {
  try {
    // Use the unified stats instead of only raw entries
    return getUnifiedMoodStats(userId, viewMode, selectedDate);
  } catch (error) {
    console.error("Error fetching mood stats:", error);

    // If it's a permission error, return default stats
    if (error.code === 'permission-denied') {
      console.warn("Permission denied - Check Firestore security rules.");
      return {
        averageMood: 0,
        totalEntries: 0,
        streak: 0,
        mostCommonMood: null,
        moodDistribution: {},
        weeklyTrend: 0
      };
    }

    const userFriendlyMessage = getErrorMessage(error);
    const friendlyError = new Error(userFriendlyMessage);
    friendlyError.code = error.code;
    friendlyError.originalError = error;
    throw friendlyError;
  }
};

// Get count of mood entries for the current month
export const getMoodEntriesCountForMonth = async (userId, year, month) => {
  try {
    // First try the optimized query
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    try {
      const q = query(
        moodRef,
        where("userId", "==", userId),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<", Timestamp.fromDate(endDate))
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (indexError) {
      console.warn("Composite index not available, using client-side filtering:", indexError);

      // Fallback to client-side filtering
      const q = query(
        moodRef,
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (timestamp >= startDate && timestamp < endDate) {
          count++;
        }
      });

      return count;
    }
  } catch (error) {
    console.error("Error fetching mood entries count:", error);
    return 0; // Return 0 instead of throwing to prevent dashboard from breaking
  }
};

// Check if user has mood entry for today
export const hasTodayMoodEntry = async (userId) => {
  try {
    const q = query(
      moodRef,
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));

    // Check client-side for today's entry
    const today = new Date();
    const todayString = today.toDateString();

    const hasToday = entries.some(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.toDateString() === todayString;
    });

    return hasToday;
  } catch (error) {
    console.error("Error checking today's mood entry:", error);
    return false;
  }
};

// Helper function to get date ranges
const getDateRange = (viewMode, selectedDate) => {
  const date = new Date(selectedDate);
  let startDate, endDate;

  switch (viewMode) {
    case 'today':
      startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      break;
    case 'week':
      const dayOfWeek = date.getDay();
      startDate = new Date(date);
      startDate.setDate(date.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      break;
    case 'month':
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      break;
    default:
      // For 'all' or any other case, return a very wide range
      startDate = new Date(2020, 0, 1);
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);
  }

  return { startDate, endDate };
};

// Emotional scale: 0-5 for Y-axis (Sad=0, Angry=1, Stressed=2, Neutral=3, Calm=4, Happy=5)
const MOOD_TO_EMOTIONAL_SCORE = {
  Sad: 0,
  Angry: 1,
  Stressed: 2,
  Neutral: 3,
  Calm: 4,
  Happy: 5
};

function getEmotionalScoreFromMood(mood) {
  const normalized = normalizeMoodToFinal(mood);
  return MOOD_TO_EMOTIONAL_SCORE[normalized] ?? 3;
}

function getEmotionalScoreFromValue(value) {
  // moodEntry value 1-5 fallback mapping to emotional scale 0-5
  if (value >= 4.5) return 5;   // Happy
  if (value >= 3.5) return 4;   // Calm
  if (value >= 2.5) return 3;   // Neutral
  if (value >= 1.5) return 1.5; // Stressed/Angry/Sad mid-point
  return 0.5;                   // Low/Sad/Anxious mid-point
}

/**
 * Get emotional trend data for time-series line graph.
 * Aggregates multiple entries within the same time unit (day/timestamp) using weighted averaging.
 * Diary ML: 0.3 weight | Manual Mood: 0.7 weight
 */
export const getEmotionalTrendData = async (userId, viewMode = 'month', selectedDate = new Date()) => {
  try {
    const { startDate, endDate } = getDateRange(viewMode, selectedDate);

    // 1. Fetch raw data from both sources
    const moodQ = query(moodRef, where("userId", "==", userId));
    const moodSnapshot = await getDocs(moodQ);
    const rawMoodEntries = moodSnapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().timestamp),
      source: 'manual'
    }));

    const { getDiaryMoodCounts } = await import('./diaryService');
    const diaryData = await getDiaryMoodCounts(userId, viewMode, selectedDate);
    const rawDiaryEntries = diaryData.entries.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
      source: 'diary'
    }));

    // 2. Filter by date range
    const allEntries = [...rawMoodEntries, ...rawDiaryEntries].filter(entry => {
      const entryDate = entry.timestamp;
      return entryDate >= startDate && entryDate < endDate;
    });

    // 3. Group entries by time unit (Day for week/month, Timestamp for today)
    const groupedData = {};

    allEntries.forEach(entry => {
      let timeKey;
      if (viewMode === 'today') {
        // Group by minute for daily view to catch near-simultaneous entries
        const date = new Date(entry.timestamp);
        date.setSeconds(0, 0);
        timeKey = date.getTime();
      } else {
        // Group by Date string (YYYY-MM-DD) for week/month
        timeKey = entry.timestamp.toISOString().split('T')[0];
      }

      if (!groupedData[timeKey]) {
        groupedData[timeKey] = { diaryScores: [], manualScores: [], timestamp: entry.timestamp };
      }

      if (entry.source === 'diary') {
        const score = getEmotionalScoreFromMood(entry.finalMood || "Neutral");
        groupedData[timeKey].diaryScores.push(score);
      } else {
        // Use normalization pipeline for manual names too for better accuracy
        const manualName = entry.moodName || entry.mood;
        const score = manualName
          ? getEmotionalScoreFromMood(manualName)
          : getEmotionalScoreFromValue(entry.value ?? 3);
        groupedData[timeKey].manualScores.push(score);
      }
    });

    // 4. Compute Weighted Monthly/Daily Points & Apply Sequential Smoothing
    let sortedPoints = Object.entries(groupedData).map(([key, data]) => {
      const diaryAvg = data.diaryScores.length > 0
        ? data.diaryScores.reduce((a, b) => a + b, 0) / data.diaryScores.length
        : null;
      const manualAvg = data.manualScores.length > 0
        ? data.manualScores.reduce((a, b) => a + b, 0) / data.manualScores.length
        : null;

      let finalScore;
      if (diaryAvg !== null && manualAvg !== null) {
        // Weighted combination: 0.3 Diary ML + 0.7 Manual Selection
        finalScore = (diaryAvg * 0.3) + (manualAvg * 0.7);
      } else {
        finalScore = diaryAvg ?? manualAvg ?? 3; // Neutral baseline
      }

      const d = data.timestamp;
      let label;
      if (viewMode === 'today') {
        label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (viewMode === 'week') {
        label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      } else {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        x: label,
        y: finalScore, // Keep raw score for now, will round after smoothing
        timestamp: key,
        rawTimestamp: d,
        isAggregated: (data.diaryScores.length + data.manualScores.length) > 1
      };
    }).sort((a, b) => {
      return viewMode === 'today' ? a.timestamp - b.timestamp : a.timestamp.localeCompare(b.timestamp);
    });

    // Apply Emotional Inertia Smoothing: (Previous * 0.25) + (Current * 0.75)
    // Reduced inertia so recent happy/calm entries can shift the chart upward quickly
    const dataPoints = sortedPoints.map((p, idx, arr) => {
      if (idx === 0) return { ...p, y: Math.round(p.y * 10) / 10 };

      const previousSmoothed = arr[idx - 1].y; // Sequential smoothing uses previously modified value
      const rawCurrent = p.y;
      const smoothed = (previousSmoothed * 0.25) + (rawCurrent * 0.75);

      // Update object in-place for sequential benefit
      p.y = smoothed;

      return {
        ...p,
        y: Math.round(smoothed * 10) / 10
      };
    });

    // 5. Aggregate Weekly for Monthly View
    if (viewMode === 'month' && dataPoints.length > 0) {
      const weeklyChunks = [];
      const byWeek = {};

      dataPoints.forEach(p => {
        const d = new Date(p.rawTimestamp);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!byWeek[weekKey]) byWeek[weekKey] = [];
        byWeek[weekKey].push(p.y);
      });

      Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, scores], idx) => {
        const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
        weeklyChunks.push({
          x: `Week ${idx + 1}`,
          y: Math.round(avg * 10) / 10,
          timestamp: key,
          count: scores.length
        });
      });
      return { dataPoints: weeklyChunks, totalEntries: allEntries.length, rawPoints: dataPoints };
    }

    console.log(`📊 [TrendService] Aggregated ${allEntries.length} entries into ${dataPoints.length} chart points (${viewMode})`);

    return {
      dataPoints,
      totalEntries: allEntries.length,
      rawPoints: dataPoints
    };
  } catch (error) {
    console.error("Error getting emotional trend data:", error);
    return { dataPoints: [], totalEntries: 0, rawPoints: [] };
  }
};

/**
 * Get aggregated mood counts combining moodEntries and diaryEntries.
 * Ensures consistent finalMood categorization after weighting.
 */
export const getAggregatedMoodCounts = async (userId, viewMode = 'month', selectedDate = new Date()) => {
  try {
    const trendData = await getEmotionalTrendData(userId, viewMode, selectedDate);

    if (trendData.rawPoints.length === 0) {
      return {
        moodCounts: { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 },
        totalEntries: 0,
        dataPoints: [],
        rawPoints: [],
        dominantMood: "Neutral",
        firstMood: "Neutral",
        lastMood: "Neutral",
        trendMessage: "No data available."
      };
    }

    const moodCounts = { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 };

    // Map aggregated score (0-5) back to a dominant category for the summary counts
    trendData.rawPoints.forEach(point => {
      const score = point.y;
      let category = "Neutral";
      if (score < 0.8) category = "Sad";
      else if (score < 1.8) category = "Angry";
      else if (score < 2.8) category = "Stressed";
      else if (score < 3.8) category = "Neutral";
      else if (score < 4.8) category = "Calm";
      else category = "Happy";

      moodCounts[category]++;
    });

    // Determine dominant mood
    const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
      moodCounts[a] > moodCounts[b] ? a : b, "Neutral");

    // Progression Logic: Detect first and last mood in the series
    const firstPoint = trendData.rawPoints[0];
    const lastPoint = trendData.rawPoints[trendData.rawPoints.length - 1];

    const getCategoryFromScore = (score) => {
      if (score < 0.8) return "Sad";
      if (score < 1.8) return "Angry";
      if (score < 2.8) return "Stressed";
      if (score < 3.8) return "Neutral";
      if (score < 4.8) return "Calm";
      return "Happy";
    };

    const firstMood = getCategoryFromScore(firstPoint.y);
    const lastMood = getCategoryFromScore(lastPoint.y);

    // Trend Direction
    let trendMessage = "";
    const scoreDiff = lastPoint.y - firstPoint.y;

    if (trendData.rawPoints.length < 2) {
      trendMessage = `Your current emotional state reflects how you're feeling right now.`;
    } else if (Math.abs(scoreDiff) < 0.5) {
      trendMessage = `Your mood remained fairly consistent throughout the ${viewMode === 'today' ? 'day' : 'period'}.`;
    } else if (scoreDiff > 0.5) {
      trendMessage = `Your emotional state improved as the ${viewMode === 'today' ? 'day' : 'period'} progressed.`;
    } else if (scoreDiff < -0.5) {
      trendMessage = `Your mood shifted from a ${firstMood.toLowerCase()} state earlier to a more ${lastMood.toLowerCase()} state later in the ${viewMode === 'today' ? 'day' : 'period'}.`;
    }

    return {
      moodCounts,
      totalEntries: trendData.totalEntries,
      dataPoints: trendData.dataPoints,
      rawPoints: trendData.rawPoints,
      dominantMood,
      firstMood,
      lastMood,
      trendMessage
    };
  } catch (error) {
    console.error("Error getting aggregated mood counts:", error);
    return {
      moodCounts: { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 },
      totalEntries: 0,
      dataPoints: [],
      rawPoints: [],
      dominantMood: "Neutral",
      firstMood: "Neutral",
      lastMood: "Neutral",
      trendMessage: ""
    };
  }
};

/**
 * Get unified stats for the dashboard using combined dataset.
 */
export const getUnifiedMoodStats = async (userId, viewMode = 'month', selectedDate = new Date()) => {
  try {
    const trendData = await getEmotionalTrendData(userId, viewMode, selectedDate);
    const hasTodayEntry = await hasTodayMoodEntry(userId);
    
    if (trendData.rawPoints.length === 0) {
      return {
        moodStats: { averageMood: 0, totalEntries: 0, mostCommonMood: "Neutral", moodDistribution: {} },
        aggregatedMoodData: { moodCounts: { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 }, totalEntries: 0, dominantMood: "Neutral", trendMessage: "No data available." },
        hasTodayEntry
      };
    }

    const totalScore = trendData.rawPoints.reduce((sum, p) => sum + p.y, 0);
    const averageScore = totalScore / trendData.rawPoints.length;

    // Build the aggregated counts for distribution
    const aggregated = await getAggregatedMoodCounts(userId, viewMode, selectedDate);

    // Calculate distribution percentages
    const moodDistribution = {};
    Object.entries(aggregated.moodCounts).forEach(([mood, count]) => {
      if (count > 0) {
        moodDistribution[mood] = ((count / trendData.rawPoints.length) * 100).toFixed(1);
      }
    });

    return {
      moodStats: {
        averageMood: parseFloat(averageScore.toFixed(1)), // 0-5 scale
        totalEntries: trendData.totalEntries,
        mostCommonMood: aggregated.dominantMood,
        moodDistribution
      },
      aggregatedMoodData: {
        ...aggregated,
        hasData: trendData.rawPoints.length > 0
      },
      hasTodayEntry
    };
  } catch (error) {
    console.error("Error in getUnifiedMoodStats:", error);
    return { 
      moodStats: { averageMood: 0, totalEntries: 0, mostCommonMood: "Neutral", moodDistribution: {} },
      aggregatedMoodData: { moodCounts: { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 }, totalEntries: 0, dominantMood: "Neutral" },
      hasTodayEntry: false
    };
  }
};

/**
 * Get unified emotional stats for the dashboard.
 * Uses the interpreted emotional dataset (Diary weighted ML + Manual).
 */
export const getUnifiedEmotionalStats = async (userId, viewMode = 'month', selectedDate = new Date()) => {
  try {
    const trendData = await getEmotionalTrendData(userId, viewMode, selectedDate);

    if (trendData.rawPoints.length === 0) {
      return {
        averageScore: 0,
        label: 'No Data',
        color: '#9ca3af',
        totalEntries: 0
      };
    }

    // Calculate average from interpretation pipeline (rawPoints are already weighted and smoothed)
    const totalScore = trendData.rawPoints.reduce((sum, p) => sum + p.y, 0);
    const averageScore = totalScore / trendData.rawPoints.length;

    let label = 'Balanced';
    let color = '#6b7280';

    if (averageScore >= 4.2) {
      label = 'Thriving';
      color = '#10b981';
    } else if (averageScore >= 3.5) {
      label = 'Positive';
      color = '#06b6d4';
    } else if (averageScore >= 2.5) {
      label = 'Balanced';
      color = '#6b7280';
    } else if (averageScore >= 1.5) {
      label = 'Strained';
      color = '#f59e0b';
    } else {
      label = 'Low';
      color = '#ef4444';
    }

    return {
      averageScore: Math.round(averageScore * 10) / 10,
      label,
      color,
      totalEntries: trendData.totalEntries
    };
  } catch (error) {
    console.error("Error getting unified emotional stats:", error);
    return { averageScore: 0, label: 'Error', color: '#9ca3af', totalEntries: 0 };
  }
};

// Helper: Map moodEntry moodName to final categories
function mapMoodNameToFinal(moodName) {
  if (!moodName) return "Neutral";

  const moodLower = moodName.toLowerCase();
  if (moodLower.includes("happy") || moodLower.includes("loved") || moodLower.includes("grateful")) {
    return "Happy";
  }
  if (moodLower.includes("sad") || moodLower.includes("crying")) {
    return "Sad";
  }
  if (moodLower.includes("frustrated") || moodLower.includes("mad")) {
    return "Angry";
  }
  if (moodLower.includes("anxious") || moodLower.includes("stressed") || moodLower.includes("worried") || moodLower.includes("panic")) {
    return "Stressed";
  }
  if (moodLower.includes("calm") || moodLower.includes("peace") || moodLower.includes("relaxed")) {
    return "Calm";
  }
  if (moodLower.includes("tired") || moodLower.includes("exhausted") || moodLower.includes("neutral")) {
    return "Neutral";
  }
  return "Neutral";
}

// Helper: Normalize mood to final categories
function normalizeMoodToFinal(mood) {
  if (!mood) return "Neutral";

  const moodLower = mood.toLowerCase();
  const validMoods = ["Happy", "Sad", "Angry", "Stressed", "Calm", "Neutral"];

  if (validMoods.some(m => moodLower === m.toLowerCase())) {
    return validMoods.find(m => moodLower === m.toLowerCase());
  }

  if (moodLower.includes("happy") || moodLower.includes("joy") || moodLower.includes("loved") || moodLower.includes("grateful")) {
    return "Happy";
  }
  if (moodLower.includes("sad") || moodLower.includes("depressed") || moodLower.includes("crying")) {
    return "Sad";
  }
  if (moodLower.includes("angry") || moodLower.includes("mad") || moodLower.includes("frustrated")) {
    return "Angry";
  }
  if (moodLower.includes("stress") || moodLower.includes("anxious") || moodLower.includes("worried") || moodLower.includes("panic")) {
    return "Stressed";
  }
  if (moodLower.includes("calm") || moodLower.includes("peace") || moodLower.includes("relaxed")) {
    return "Calm";
  }
  if (moodLower.includes("tired") || moodLower.includes("exhausted") || moodLower.includes("neutral")) {
    return "Neutral";
  }

  return "Neutral";
}

// Helper: Build time series data for charts
function buildTimeSeriesData(entries, viewMode, startDate, endDate) {
  const timeSeries = [];
  const moodCountsByPeriod = {};

  entries.forEach(entry => {
    let mood = "Neutral";
    if (entry.source === 'diaryEntry') {
      mood = entry.finalMood || "Neutral";
    } else if (entry.source === 'moodEntry') {
      mood = mapMoodNameToFinal(entry.moodName || entry.mood || "");
    }
    mood = normalizeMoodToFinal(mood);

    const entryDate = new Date(entry.timestamp);
    let periodKey;

    if (viewMode === 'day') {
      periodKey = entryDate.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (viewMode === 'week') {
      const weekStart = new Date(entryDate);
      weekStart.setDate(entryDate.getDate() - entryDate.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else { // month
      periodKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!moodCountsByPeriod[periodKey]) {
      moodCountsByPeriod[periodKey] = { Happy: 0, Sad: 0, Angry: 0, Stressed: 0, Calm: 0, Neutral: 0 };
    }

    if (moodCountsByPeriod[periodKey].hasOwnProperty(mood)) {
      moodCountsByPeriod[periodKey][mood]++;
    }
  });

  // Convert to array format sorted by period
  Object.entries(moodCountsByPeriod)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([period, counts]) => {
      timeSeries.push({
        period,
        ...counts
      });
    });

  return timeSeries;
}

// Helper function to calculate mood statistics
const calculateMoodStats = (entries) => {
  if (entries.length === 0) {
    return {
      averageMood: 0,
      totalEntries: 0,
      streak: 0,
      mostCommonMood: null,
      moodDistribution: {},
      weeklyTrend: 0,
      weeklySeries: [0, 0, 0, 0, 0, 0, 0]
    };
  }

  // Use the refined mapping for stats too
  const totalEntries = entries.length;
  const totalValue = entries.reduce((sum, entry) => {
    // If it's an entry from the integrated dataset, it might have refined scores
    // But calculateMoodStats is usually called on raw manual entries first.
    // To match 1-5 scale in UI, we return something compatible.
    return sum + (entry.value || 3);
  }, 0);

  const averageMood = totalValue / totalEntries;

  // Find most common mood
  const moodCounts = {};
  entries.forEach(entry => {
    const moodLabel = entry.moodName || entry.mood || "Neutral";
    moodCounts[moodLabel] = (moodCounts[moodLabel] || 0) + 1;
  });

  const mostCommonMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
    , "Neutral");

  // Calculate streak (consecutive days with entries)
  const streak = calculateStreak(entries);

  // Calculate mood distribution
  const moodDistribution = {};
  Object.keys(moodCounts).forEach(mood => {
    moodDistribution[mood] = (moodCounts[mood] / entries.length * 100).toFixed(1);
  });

  // Calculate weekly trend (simplified)
  const weeklyTrend = calculateWeeklyTrend(entries);

  // Build weekly series for charts (7 values Sun..Sat for current week)
  const weeklySeries = buildWeeklySeries(entries);

  // Build monthly series for charts (30 values for current month)
  const monthlySeries = buildMonthlySeries(entries);

  return {
    averageMood: parseFloat(averageMood.toFixed(1)),
    totalEntries,
    streak,
    mostCommonMood,
    moodDistribution,
    weeklyTrend,
    weeklySeries,
    monthlySeries
  };
};

// Helper function to calculate consecutive day streak
const calculateStreak = (entries) => {
  if (entries.length === 0) return 0;

  const sortedEntries = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].timestamp);
    const entryDateString = entryDate.toDateString();
    const currentDateString = currentDate.toDateString();

    if (entryDateString === currentDateString) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (entryDate < currentDate) {
      break;
    }
  }

  return streak;
};

// Helper function to calculate weekly trend
const calculateWeeklyTrend = (entries) => {
  if (entries.length < 2) return 0;

  const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const half = Math.floor(sortedEntries.length / 2);
  const firstHalf = sortedEntries.slice(0, half);
  const secondHalf = sortedEntries.slice(half);

  if (firstHalf.length === 0 || secondHalf.length === 0) return 0;

  const avg = (arr) => arr.reduce((s, e) => s + (e.value || 0), 0) / arr.length;
  const firstHalfAvg = avg(firstHalf);
  const secondHalfAvg = avg(secondHalf);
  if (firstHalfAvg === 0) return 0;

  return parseFloat((((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1));
};

// Build 7-day weekly series for the current week (Sun..Sat). If no data for a day, carry last known or use 0.
const buildWeeklySeries = (entries) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday
  start.setHours(0, 0, 0, 0);
  const dayValues = Array(7).fill(null);

  // Aggregate to last value per day in the current week
  entries.forEach(e => {
    const d = new Date(e.timestamp);
    if (d >= start && d < new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)) {
      const idx = (d.getDay());
      dayValues[idx] = e.value || 0; // keep last encountered value for that day
    }
  });

  // Fill missing values: forward fill from previous, start at 0
  let last = 0;
  for (let i = 0; i < 7; i++) {
    if (dayValues[i] == null) dayValues[i] = last;
    else last = dayValues[i];
  }

  // Ensure within 1..5 range
  return dayValues.map(v => Math.max(0, Math.min(5, v || 0)));
};

// Build 30-day monthly series for the current month. If no data for a day, carry last known or use 0.
const buildMonthlySeries = (entries) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
  const daysInMonth = end.getDate();
  const dayValues = Array(daysInMonth).fill(null);

  // Aggregate to last value per day in the current month
  entries.forEach(e => {
    const d = new Date(e.timestamp);
    if (d >= start && d <= end) {
      const dayOfMonth = d.getDate() - 1; // Convert to 0-based index
      dayValues[dayOfMonth] = e.value || 0; // keep last encountered value for that day
    }
  });

  // Fill missing values: forward fill from previous, start at 0
  let last = 0;
  for (let i = 0; i < daysInMonth; i++) {
    if (dayValues[i] == null) dayValues[i] = last;
    else last = dayValues[i];
  }

  // Ensure within 1..5 range
  return dayValues.map(v => Math.max(0, Math.min(5, v || 0)));
};
