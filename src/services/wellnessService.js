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
  Calm: 4,
  Neutral: 3,
  Sad: 2,
  Frustrated: 2,
  Angry: 2,
  Stressed: 2,
  Crying: 1,
  Tired: 2
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
      ...moodEntries.map(m => ({ score: m.value || MOOD_TO_SCORE[m.moodName] || 3, mood: m.moodName || "Neutral" })),
      ...diaryEntries.map(d => ({ score: MOOD_TO_SCORE[d.finalMood] || 3, mood: d.finalMood || "Neutral" }))
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
export const generateYearlyReport = async (userId) => {
  try {
    const summaries = await getDailySummaries(userId, 365);
    if (summaries.length === 0) return null;

    const yearlyAverage = summaries.reduce((sum, s) => sum + s.averageMoodScore, 0) / summaries.length;

    // Trend Direction (using first vs last 30 days available)
    const first30 = summaries.slice(0, 30);
    const last30 = summaries.slice(-30);
    const firstAvg = first30.reduce((sum, s) => sum + s.averageMoodScore, 0) / first30.length;
    const lastAvg = last30.reduce((sum, s) => sum + s.averageMoodScore, 0) / last30.length;

    let trendDirection = "stable";
    if (lastAvg - firstAvg > 0.5) trendDirection = "improving";
    else if (firstAvg - lastAvg > 0.5) trendDirection = "declining";

    // Stability (average variance)
    const avgVar = summaries.reduce((sum, s) => sum + s.moodVariance, 0) / summaries.length;
    let moodStability = avgVar < 1.0 ? "high" : (avgVar < 2.0 ? "moderate" : "volatile");

    // Insight Summary
    let insightSummary = `Over the past year, your emotional state has been ${trendDirection}.`;
    if (trendDirection === "stable") insightSummary = `Over the past year, your emotional state has remained mostly consistent.`;

    if (moodStability === "volatile") insightSummary += " You experienced significant emotional fluctuations.";

    const lowPeriods = summaries.filter(s => s.averageMoodScore < 2.0).length;
    if (lowPeriods > 30) insightSummary += " There were some extended periods of low mood.";

    return {
      yearlyAverage: parseFloat(yearlyAverage.toFixed(2)),
      trendDirection,
      moodStability,
      insightSummary,
      data: summaries.map(s => ({ date: s.date, score: s.averageMoodScore }))
    };
  } catch (error) {
    console.error("Error generating yearly report:", error);
    return null;
  }
};
