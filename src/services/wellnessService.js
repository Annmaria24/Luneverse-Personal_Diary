import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { getDiaryMoodCounts } from "./diaryService";
import { getMoodHistory } from "./moodService";

const MOOD_TO_SCORE = {
  Happy: 5,
  Loved: 5,
  Grateful: 5,
  Healthy: 5,
  Calm: 4,
  Relaxed: 4,
  Peaceful: 4,
  Neutral: 3,
  Stressed: 2,
  Anxious: 2,
  Tired: 2,
  Overwhelmed: 2,
  Angry: 1,
  Frustrated: 1,
  Annoyed: 1,
  Sad: 0,
  Crying: 0,
  Lonely: 0,
  Depressed: 0
};

/**
 * Updates or creates a daily emotional summary for a user on a given date.
 * Aggregates data from both diaryEntries and moodEntries.
 */
export const updateDailySummary = async (userId, dateStr) => {
  try {
    const date = new Date(dateStr);

    // Fetch both sources for the specific day
    const moodEntries = await getMoodHistory(userId, {
      viewMode: 'today',
      selectedDate: date
    });

    const diaryData = await getDiaryMoodCounts(userId, 'today', date);
    const diaryEntries = diaryData.entries;

    const allEntries = [
      ...moodEntries.map(m => ({ 
        score: (typeof m.value === 'number' ? m.value : (MOOD_TO_SCORE[m.moodName] ?? 3)), 
        mood: m.moodName || "Neutral" 
      })),
      ...diaryEntries.map(d => ({ 
        score: (typeof d.score === 'number' ? d.score : (MOOD_TO_SCORE[d.finalMood] ?? 3)), 
        mood: d.finalMood || "Neutral" 
      }))
    ];

    if (allEntries.length === 0) return null;

    const entryCount = allEntries.length;
    const totalScore = allEntries.reduce((sum, e) => sum + e.score, 0);
    const averageMoodScore = totalScore / entryCount;

    // Dominant Mood
    const counts = {};
    allEntries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    const dominantMood = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    // Variance
    const variance = allEntries.reduce((sum, e) => sum + Math.pow(e.score - averageMoodScore, 2), 0) / entryCount;

    const summaryData = {
      date: dateStr,
      averageMoodScore: parseFloat(averageMoodScore.toFixed(2)),
      dominantMood,
      moodVariance: parseFloat(variance.toFixed(2)),
      entryCount,
      updatedAt: Timestamp.now()
    };

    const summaryRef = doc(db, `users/${userId}/dailySummaries/${dateStr}`);
    await setDoc(summaryRef, summaryData);

    return summaryData;
  } catch (error) {
    console.error("Error updating daily summary:", error);
    throw error;
  }
};

/**
 * Fetches daily summaries for a date range.
 */
export const getDailySummaries = async (userId, days = 30) => {
  try {
    const summariesRef = collection(db, `users/${userId}/dailySummaries`);
    const q = query(
      summariesRef,
      orderBy("date", "desc"),
      limit(days)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching daily summaries:", error);
    return [];
  }
};

/**
 * Analyzes depression risk based on long-term daily summaries.
 */
export const analyzeDepressionRisk = async (userId) => {
  try {
    const last30Days = await getDailySummaries(userId, 30);
    if (last30Days.length < 5) {
      return { riskLevel: "LOW", reasoning: "Insufficient data for long-term analysis.", recommendation: "Continue logging your mood daily to get insights." };
    }

    const last14 = last30Days.slice(-14);
    const avg14 = last14.reduce((sum, s) => sum + s.averageMoodScore, 0) / last14.length;

    const lowMoodDays = last14.filter(s => s.averageMoodScore < 2.5).length;
    const avgVariance = last14.reduce((sum, s) => sum + s.moodVariance, 0) / last14.length;

    // Step 4 Logic:
    // HIGH: avg < 2.5 persists for 10+ days (in last 14) and low variance
    if (avg14 < 2.5 && lowMoodDays >= 10 && avgVariance < 0.8) {
      return {
        riskLevel: "HIGH",
        reasoning: "Your mood has been consistently low for most of the past two weeks with very little fluctuation.",
        recommendation: "We’ve noticed that you’ve been feeling low for several days. You’re not alone. It might help to talk to someone you trust or seek professional support."
      };
    }

    // MODERATE: fluctuating but often low
    const totalAvg = last30Days.reduce((sum, s) => sum + s.averageMoodScore, 0) / last30Days.length;
    if (totalAvg < 3.0 || lowMoodDays >= 5) {
      return {
        riskLevel: "MODERATE",
        reasoning: "You've had quite a few low points recently, though your mood does fluctuate.",
        recommendation: "It seems like things have been a bit heavy lately. Consider trying some journaling, breathing exercises, or using our relaxation module."
      };
    }

    return {
      riskLevel: "LOW",
      reasoning: "Your recent emotional trends appear stable and within a healthy range.",
      recommendation: "Keep maintaining your wellness routine!"
    };
  } catch (error) {
    console.error("Error analyzing depression risk:", error);
    return { riskLevel: "LOW", reasoning: "Analysis error.", recommendation: "" };
  }
};

/**
 * Generates a 1-year mental health report.
 */
/**
 * Generates a yearly mental health report by aggregating daily summaries.
 * FALLBACK: If summaries are missing, aggregates raw data on-the-fly.
 */
export const generateYearlyReport = async (userId) => {
  try {
    let summaries = await getDailySummaries(userId, 365);
    
    // Aggregation Fallback: If no summaries exist, build them in-memory from raw data
    if (!summaries || summaries.length === 0) {
      console.log("🔄 No summaries found, calculating report from raw entries...");
      
      const moodRef = collection(db, "moodEntries");
      const moodSnap = await getDocs(query(moodRef, where("userId", "==", userId)));
      const diaryRef = collection(db, "diaryEntries");
      const diarySnap = await getDocs(query(diaryRef, where("userId", "==", userId)));
      
      const rawData = [];
      moodSnap.docs.forEach(d => {
        const data = d.data();
        const score = data.value || MOOD_TO_SCORE[data.moodName] || 3;
        const ts = data.timestamp || data.createdAt;
        let dateKey = data.date;
        if (!dateKey) {
          try {
            const dateObj = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
            dateKey = dateObj.toISOString().split('T')[0];
          } catch (e) {
            dateKey = new Date().toISOString().split('T')[0];
          }
        }
        if (dateKey && dateKey !== 'Invalid Date') {
          rawData.push({ score, dateKey });
        }
      });
      diarySnap.docs.forEach(d => {
        const data = d.data();
        const score = MOOD_TO_SCORE[data.finalMood] || 3;
        const ts = data.timestamp || data.createdAt;
        let dateKey = data.date;
        if (!dateKey) {
          try {
            const dateObj = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
            dateKey = dateObj.toISOString().split('T')[0];
          } catch (e) {
            dateKey = new Date().toISOString().split('T')[0];
          }
        }
        if (dateKey && dateKey !== 'Invalid Date') {
          rawData.push({ score, dateKey });
        }
      });

      if (rawData.length === 0) return null;

      // Group and average in-memory
      const grouped = {};
      rawData.forEach(r => {
        if (!grouped[r.dateKey]) grouped[r.dateKey] = [];
        grouped[r.dateKey].push(r.score);
      });

      summaries = Object.entries(grouped).map(([date, scores]) => ({
        date,
        averageMoodScore: scores.reduce((a, b) => a + b, 0) / scores.length
      })).sort((a, b) => a.date.localeCompare(b.date));
    }

    if (!summaries || summaries.length === 0) return null;

    // Calculate trends and metadata
    const scores = summaries.map(s => s.averageMoodScore);
    const yearlyAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const startScore = scores[0];
    const endScore = scores[scores.length - 1];
    const trendDirection = endScore > startScore ? 'improving' : endScore < startScore ? 'declining' : 'stable';
    
    // Calculate stability (standard deviation)
    const variance = scores.reduce((a, b) => a + Math.pow(b - yearlyAverage, 2), 0) / scores.length;
    const moodStability = Math.sqrt(variance) < 0.8 ? 'High' : Math.sqrt(variance) < 1.5 ? 'Moderate' : 'Dynamic';

    const generateInsightText = (avg, trend, stability) => {
      let text = "Your emotional journey ";
      if (trend === 'improving') text += "shows a wonderful upward trend. ";
      else if (trend === 'declining') text += "has had some more challenging days recently. ";
      else text += "has remained remarkably steady. ";

      if (avg >= 4.0) text += "You've maintained a consistently high state of well-being.";
      else if (avg >= 3.0) text += "You're generally finding a good balance in your days.";
      else text += "It's been a heavier period, remember to be kind to yourself.";

      return text;
    };

    const insightSummary = generateInsightText(yearlyAverage, trendDirection, moodStability);

    // Group by Month for a cleaner, less congested annual view
    const monthlyGroups = {};
    summaries.forEach(s => {
      const [year, month] = s.date.split('-');
      const monthKey = `${year}-${month}`;
      if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = [];
      monthlyGroups[monthKey].push(s.averageMoodScore);
    });

    const monthlyData = Object.entries(monthlyGroups).map(([month, scores]) => ({
      date: month, // Format: YYYY-MM
      score: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      yearlyAverage: parseFloat(yearlyAverage.toFixed(2)),
      trendDirection,
      moodStability,
      insightSummary,
      data: monthlyData // Return monthly averages instead of daily points
    };
  } catch (error) {
    console.error("Error generating yearly report:", error);
    return null;
  }
};


/**
 * Rebuilds daily summaries for a user by scanning their entire entry history efficiently.
 * Optimized to fetch data once rather than in a loop.
 */
export const rebuildDailySummaries = async (userId) => {
  try {
    console.log("🛠️ Rebuilding daily emotional summaries efficiently for user:", userId);
    
    // 1. Fetch ALL data once
    const moodRef = collection(db, "moodEntries");
    const moodSnap = await getDocs(query(moodRef, where("userId", "==", userId)));
    const rawMoods = moodSnap.docs.map(doc => doc.data());

    const diaryRef = collection(db, "diaryEntries");
    const diarySnap = await getDocs(query(diaryRef, where("userId", "==", userId)));
    const rawDiaries = diarySnap.docs.map(doc => doc.data());

    if (rawMoods.length === 0 && rawDiaries.length === 0) {
      console.log("No raw entries found. Nothing to rebuild.");
      return true;
    }

    const moodEntries = rawMoods.map(data => {
      const ts = data.timestamp || data.createdAt;
      const dateObj = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
      const dateKey = data.date || dateObj.toISOString().split('T')[0];
      return {
        ...data,
        score: data.value || MOOD_TO_SCORE[data.moodName] || 3,
        mood: data.moodName || "Neutral",
        dateKey
      };
    });

    const diaryEntries = rawDiaries.map(data => {
      const ts = data.timestamp || data.createdAt;
      const dateObj = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : new Date());
      const dateKey = data.date || dateObj.toISOString().split('T')[0];
      return {
        ...data,
        score: MOOD_TO_SCORE[data.finalMood] || 3,
        mood: data.finalMood || "Neutral",
        dateKey
      };
    });

    // 2. Group by date
    const grouped = {};
    [...moodEntries, ...diaryEntries].forEach(entry => {
      if (!entry.dateKey || entry.dateKey === 'Invalid Date' || entry.dateKey === 'undefined') return;
      if (!grouped[entry.dateKey]) grouped[entry.dateKey] = [];
      grouped[entry.dateKey].push(entry);
    });

    const dates = Object.keys(grouped).filter(d => d !== 'undefined').sort((a, b) => b.localeCompare(a)).slice(0, 365);
    console.log(`📊 Processing ${dates.length} dates with summaries.`);

    // 3. Generate and save summaries in batches
    const batchSize = 15; // Slightly smaller to be safer
    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      console.log(`📡 Process batch ${Math.floor(i/batchSize) + 1}...`);
      await Promise.all(batch.map(async (dateStr) => {
        try {
          const dayEntries = grouped[dateStr];
          if (!dayEntries || dayEntries.length === 0) return;
          
          const entryCount = dayEntries.length;
          const totalScore = dayEntries.reduce((sum, e) => sum + e.score, 0);
          const averageMoodScore = totalScore / entryCount;

          const counts = {};
          dayEntries.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
          const dominantMood = Object.keys(counts).reduce((a, b) => (counts[a] || 0) > (counts[b] || 0) ? a : b);
          const variance = dayEntries.reduce((sum, e) => sum + Math.pow(e.score - averageMoodScore, 2), 0) / entryCount;

          const summaryData = {
            date: dateStr,
            averageMoodScore: parseFloat(averageMoodScore.toFixed(2)),
            dominantMood,
            moodVariance: parseFloat(variance.toFixed(2)),
            entryCount,
            updatedAt: Timestamp.now()
          };

          const summaryRef = doc(db, `users/${userId}/dailySummaries/${dateStr}`);
          await setDoc(summaryRef, summaryData);
        } catch (err) {
          console.warn(`⚠️ Failed summary for ${dateStr}:`, err);
        }
      }));
    }

    console.log(`✅ Efficient rebuild complete! Processed ${dates.length} dates.`);
    return true;
  } catch (error) {
    console.error("Error rebuilding daily summaries:", error);
    return false;
  }
};
