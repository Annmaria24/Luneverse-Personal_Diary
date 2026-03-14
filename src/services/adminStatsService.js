import { db, auth } from "../firebase/config";
import { addDoc, collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, Timestamp, where, setDoc } from "firebase/firestore";

export const getTotals = async () => {
  let usersTotal = 0;
  let sessionsTotal = 0;
  let averageSessionMinutes = 0;
  
  try {
    console.log('Fetching users count...');
    const usersCount = await getCountFromServer(collection(db, 'users'));
    usersTotal = usersCount.data().count || 0;
    console.log('Users count from aggregation:', usersTotal);
  } catch (e) {
    console.log('Aggregation failed, using getDocs fallback:', e.message);
    try {
      const snap = await getDocs(collection(db, 'users'));
      usersTotal = snap.size;
      console.log('Users count from getDocs:', usersTotal);
    } catch (fallbackError) {
      console.error('Both methods failed for users:', fallbackError);
      usersTotal = 0;
    }
  }
  
  try {
    console.log('Fetching sessions count...');
    const sCount = await getCountFromServer(collection(db, 'activitySessions'));
    sessionsTotal = sCount.data().count || 0;
    console.log('Sessions count from aggregation:', sessionsTotal);
  } catch (e) {
    console.log('Sessions aggregation failed, using getDocs fallback:', e.message);
    try {
      const snap = await getDocs(collection(db, 'activitySessions'));
      sessionsTotal = snap.size;
      console.log('Sessions count from getDocs:', sessionsTotal);
    } catch (fallbackError) {
      console.error('Both methods failed for sessions:', fallbackError);
      sessionsTotal = 0;
    }
  }
  
  try {
    console.log('Fetching admin stats...');
    const statsDoc = await getDoc(doc(db, 'adminStats', 'activity'));
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      averageSessionMinutes = data.averageSessionMinutes || 0;
      console.log('Average session minutes from stats:', averageSessionMinutes);
    } else {
      console.log('No admin stats document found, computing from sessions...');
      // Compute from actual sessions if no aggregate exists
      const sessionsSnap = await getDocs(collection(db, 'activitySessions'));
      let totalMinutes = 0;
      let validSessions = 0;
      
      sessionsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.start && data.end) {
          const startTime = data.start.toDate ? data.start.toDate().getTime() : new Date(data.start).getTime();
          const endTime = data.end.toDate ? data.end.toDate().getTime() : new Date(data.end).getTime();
          if (endTime > startTime) {
            const minutes = Math.max(1, Math.round((endTime - startTime) / 60000));
            totalMinutes += minutes;
            validSessions++;
          }
        }
      });
      
      averageSessionMinutes = validSessions > 0 ? totalMinutes / validSessions : 0;
      console.log('Computed average session minutes:', averageSessionMinutes);
    }
  } catch (e) {
    console.error('Error fetching admin stats:', e);
    averageSessionMinutes = 0;
  }
  
  return { users: usersTotal, sessions: sessionsTotal, averageSessionMinutes };
};

export const getRecentUsers = async (max = 8) => {
  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(max)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.slice(0, max).map(d => ({ id: d.id, ...d.data() }));
  }
};

export const getSessionSeries = async (days = 14) => {
  try {
    const end = Timestamp.now();
    const start = Timestamp.fromMillis(end.toMillis() - days * 86400000);
    let snap;
    try {
      snap = await getDocs(query(collection(db, 'activitySessions'), where('start', '>=', start), orderBy('start', 'asc')));
    } catch (primaryErr) {
      console.warn('Primary session series query failed, falling back to client-side filter:', primaryErr?.message);
      // Fallback: fetch all and filter client-side
      const all = await getDocs(collection(db, 'activitySessions'));
      // Create a mock snapshot-like object
      snap = { docs: all.docs.filter(d => {
        const s = d.data().start;
        const ts = s?.toDate ? s.toDate().getTime() : null;
        return ts && ts >= start.toMillis();
      }) };
    }
    const buckets = new Map();
    for (let i = 0; i < days; i++) {
      const day = new Date(start.toMillis() + i * 86400000);
      const key = day.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const date = (data.start?.toDate ? data.start.toDate() : new Date()).toISOString().slice(0, 10);
      if (buckets.has(date)) buckets.set(date, buckets.get(date) + 1);
    });
    return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
  } catch (e) {
    console.error('Error fetching session series:', e);
    // Return empty data for the last 14 days
    const buckets = new Map();
    for (let i = 0; i < days; i++) {
      const day = new Date(Date.now() - i * 86400000);
      const key = day.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
  }
};

export const recomputeActivityAverages = async (days = 90) => {
  const end = Timestamp.now();
  const start = Timestamp.fromMillis(end.toMillis() - days * 86400000);
  const snap = await getDocs(query(collection(db, 'activitySessions'), where('start', '>=', start)));
  let totalMinutes = 0;
  let sessionCount = 0;
  snap.docs.forEach(d => {
    const s = d.data();
    const startMs = s.start?.toDate ? s.start.toDate().getTime() : null;
    const endMs = s.end?.toDate ? s.end.toDate().getTime() : null;
    if (startMs && endMs && endMs > startMs) {
      const mins = Math.max(1, Math.round((endMs - startMs) / 60000));
      totalMinutes += mins;
      sessionCount += 1;
    }
  });
  const avg = sessionCount > 0 ? totalMinutes / sessionCount : 0;
  await setDoc(doc(db, 'adminStats', 'activity'), { totalMinutes, sessionCount, averageSessionMinutes: avg }, { merge: true });
  return { totalMinutes, sessionCount, averageSessionMinutes: avg };
};

export const getSignupSeries = async (days = 14) => {
  const end = Timestamp.now();
  const start = Timestamp.fromMillis(end.toMillis() - days * 86400000);
  let snap;
  try {
    snap = await getDocs(query(collection(db, 'users'), where('createdAt', '>=', start), orderBy('createdAt', 'asc')));
  } catch (e) {
    snap = await getDocs(collection(db, 'users'));
  }
  const buckets = new Map();
  for (let i = 0; i < days; i++) {
    const day = new Date(start.toMillis() + i * 86400000);
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  snap.docs.forEach(d => {
    const data = d.data();
    const date = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0, 10) : null;
    if (date && buckets.has(date)) buckets.set(date, buckets.get(date) + 1);
  });
  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
};

/**
 * ✅ Seed sample activity sessions for the current authenticated user
 * Useful when charts are empty in a fresh environment.
 */
export const seedSampleSessionsForCurrentUser = async (days = 14, maxSessionsPerDay = 3) => {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');

  const end = new Date();
  for (let i = 0; i < days; i++) {
    const day = new Date(end.getTime() - i * 86400000);
    const sessionsToday = Math.max(1, Math.floor(Math.random() * maxSessionsPerDay));
    for (let s = 0; s < sessionsToday; s++) {
      // Random start time within the day
      const start = new Date(day);
      start.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
      const durationMins = 5 + Math.floor(Math.random() * 45);
      const endTime = new Date(start.getTime() + durationMins * 60000);

      await addDoc(collection(db, 'activitySessions'), {
        uid,
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(endTime)
      });
    }
  }

  // Recompute aggregates after seeding
  return await recomputeActivityAverages(Math.max(30, days));
};


