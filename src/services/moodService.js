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

const moodRef = collection(db, "moodEntries");

// Add a new mood entry
export const addMoodEntry = async (userId, moodData) => {
  try {
    const { mood, moodName, value, note = "", date } = moodData;
    
    // Validate required fields
    if (!mood || !moodName || value === undefined) {
      throw new Error("Missing required mood data");
    }

    const docRef = await addDoc(moodRef, {
      userId,
      mood,
      moodName,
      value,
      note,
      date: date || new Date().toISOString().split("T")[0],
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
    });
    
    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));
    
    return docRef;
  } catch (error) {
    console.error("Error adding mood entry:", error);
    throw error;
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
    
    throw error;
  }
};

// Update an existing mood entry
export const updateMoodEntry = async (entryId, updateData) => {
  try {
    const entryRef = doc(db, "moodEntries", entryId);
    await updateDoc(entryRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    
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
    await deleteDoc(entryRef);
    
    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));
  } catch (error) {
    console.error("Error deleting mood entry:", error);
    throw error;
  }
};

// Get mood statistics
export const getMoodStats = async (userId, viewMode = 'month', selectedDate = new Date()) => {
  try {
    const { startDate, endDate } = getDateRange(viewMode, selectedDate);
    
    // Use simpler query to avoid index issues
    const q = query(
      moodRef,
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    let entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
    
    // Apply client-side filtering
    entries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });

    return calculateMoodStats(entries);
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
    
    throw error;
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

  // Calculate average mood
  const averageMood = entries.reduce((sum, entry) => sum + (entry.value || 0), 0) / entries.length;

  // Find most common mood
  const moodCounts = {};
  entries.forEach(entry => {
    moodCounts[entry.moodName] = (moodCounts[entry.moodName] || 0) + 1;
  });
  
  const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
    moodCounts[a] > moodCounts[b] ? a : b
  );

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

  return {
    averageMood: parseFloat(averageMood.toFixed(1)),
    totalEntries: entries.length,
    streak,
    mostCommonMood,
    moodDistribution,
    weeklyTrend,
    weeklySeries
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
  start.setHours(0,0,0,0);
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
