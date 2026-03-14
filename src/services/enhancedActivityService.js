import { db } from "../firebase/config";
import { addDoc, collection, doc, increment, serverTimestamp, setDoc, getDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";

/**
 * ✅ Enhanced session tracking with detailed analytics
 */
export const trackUserActivity = async (uid, activityType, details = {}) => {
  try {
    const activityData = {
      uid,
      activityType,
      timestamp: serverTimestamp(),
      details: {
        ...details,
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: details.sessionId || null
      }
    };

    await addDoc(collection(db, "userActivities"), activityData);
    console.log("✅ User activity tracked:", activityType);
  } catch (error) {
    console.error("❌ Error tracking user activity:", error);
    throw error;
  }
};

/**
 * ✅ Get user session statistics
 */
export const getUserSessionStats = async (uid, days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      collection(db, "activitySessions"),
      where("uid", "==", uid),
      where("start", ">=", cutoffDate),
      orderBy("start", "desc")
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        ...data,
        start: data.start?.toDate ? data.start.toDate() : null,
        end: data.end?.toDate ? data.end.toDate() : null
      });
    });

    // Calculate statistics
    const completedSessions = sessions.filter(s => s.end);
    const totalSessions = sessions.length;
    const totalMinutes = completedSessions.reduce((sum, session) => {
      if (session.start && session.end) {
        return sum + (session.end - session.start) / (1000 * 60);
      }
      return sum;
    }, 0);

    const averageSessionLength = completedSessions.length > 0
      ? totalMinutes / completedSessions.length
      : 0;

    return {
      totalSessions,
      completedSessions: completedSessions.length,
      totalMinutes: Math.round(totalMinutes),
      averageSessionLength: Math.round(averageSessionLength),
      sessions: sessions.slice(0, 10), // Return last 10 sessions
      periodDays: days
    };
  } catch (error) {
    console.error("❌ Error getting user session stats:", error);
    throw error;
  }
};

/**
 * ✅ Get daily session counts for charts
 */
export const getDailySessionCounts = async (days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      collection(db, "activitySessions"),
      where("start", ">=", cutoffDate),
      orderBy("start", "desc")
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.start?.toDate) {
        sessions.push({
          date: data.start.toDate().toDateString(),
          timestamp: data.start.toDate().getTime()
        });
      }
    });

    // Group by date
    const dailyCounts = {};
    sessions.forEach(session => {
      const date = session.date;
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Fill in missing dates with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      result.push({
        date: dateString,
        count: dailyCounts[dateString] || 0,
        timestamp: date.getTime()
      });
    }

    return result;
  } catch (error) {
    console.error("❌ Error getting daily session counts:", error);
    throw error;
  }
};

/**
 * ✅ Get real-time active users count
 */
export const getActiveUsersCount = async (minutesAgo = 15) => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesAgo);

    const q = query(
      collection(db, "activitySessions"),
      where("start", ">=", cutoffTime),
      where("end", "==", null) // Only active sessions
    );

    const querySnapshot = await getDocs(q);
    const activeUsers = new Set();

    querySnapshot.forEach((doc) => {
      activeUsers.add(doc.data().uid);
    });

    return {
      activeUsers: activeUsers.size,
      activeSessions: querySnapshot.size,
      timestamp: new Date()
    };
  } catch (error) {
    console.error("❌ Error getting active users count:", error);
    throw error;
  }
};

/**
 * ✅ Get session duration distribution
 */
export const getSessionDurationDistribution = async (uid = null, days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let q = query(
      collection(db, "activitySessions"),
      where("start", ">=", cutoffDate),
      where("end", "!=", null),
      orderBy("start", "desc")
    );

    if (uid) {
      q = query(q, where("uid", "==", uid));
    }

    const querySnapshot = await getDocs(q);
    const durations = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.start?.toDate && data.end?.toDate) {
        const duration = (data.end.toDate() - data.start.toDate()) / (1000 * 60); // minutes
        durations.push(duration);
      }
    });

    // Categorize durations
    const distribution = {
      '0-5min': 0,
      '5-15min': 0,
      '15-30min': 0,
      '30-60min': 0,
      '60min+': 0
    };

    durations.forEach(duration => {
      if (duration < 5) distribution['0-5min']++;
      else if (duration < 15) distribution['5-15min']++;
      else if (duration < 30) distribution['15-30min']++;
      else if (duration < 60) distribution['30-60min']++;
      else distribution['60min+']++;
    });

    return {
      distribution,
      totalSessions: durations.length,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    };
  } catch (error) {
    console.error("❌ Error getting session duration distribution:", error);
    throw error;
  }
};

/**
 * ✅ Get user activity patterns
 */
export const getUserActivityPatterns = async (uid, days = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      collection(db, "userActivities"),
      where("uid", "==", uid),
      where("timestamp", ">=", cutoffDate),
      orderBy("timestamp", "desc")
    );

    const querySnapshot = await getDocs(q);
    const activities = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : null
      });
    });

    // Group by activity type
    const activityCounts = {};
    const hourlyPatterns = Array(24).fill(0);

    activities.forEach(activity => {
      if (activity.timestamp) {
        const hour = activity.timestamp.getHours();
        hourlyPatterns[hour]++;

        const type = activity.activityType;
        activityCounts[type] = (activityCounts[type] || 0) + 1;
      }
    });

    return {
      totalActivities: activities.length,
      activityCounts,
      hourlyPatterns,
      mostActiveHour: hourlyPatterns.indexOf(Math.max(...hourlyPatterns)),
      activities: activities.slice(0, 20) // Return last 20 activities
    };
  } catch (error) {
    console.error("❌ Error getting user activity patterns:", error);
    throw error;
  }
};

/**
 * ✅ Get top active users
 */
export const getTopActiveUsers = async (days = 7, limitCount = 10) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      collection(db, "activitySessions"),
      where("start", ">=", cutoffDate),
      orderBy("start", "desc")
    );

    const querySnapshot = await getDocs(q);
    const userSessions = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const uid = data.uid;
      userSessions[uid] = (userSessions[uid] || 0) + 1;
    });

    // Convert to array and sort
    const topUsers = Object.entries(userSessions)
      .map(([uid, count]) => ({ uid, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount);

    return {
      topUsers,
      totalUsers: Object.keys(userSessions).length,
      periodDays: days
    };
  } catch (error) {
    console.error("❌ Error getting top active users:", error);
    throw error;
  }
};
