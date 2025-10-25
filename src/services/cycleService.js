import { db } from "../firebase/config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { getErrorMessage } from "../utils/errorMessages";

const cycleRef = collection(db, "cycleEntries");

// Add or update cycle entry for a specific date
export const saveCycleEntry = async (userId, date, entryData) => {
  try {
    const dateKey = date.toISOString().split('T')[0];
    const docId = `${userId}_${dateKey}`;
    
    const cycleEntry = {
      userId,
      date: dateKey,
      periodStatus: entryData.periodStatus || 'none',
      flow: entryData.flow || '',
      symptoms: entryData.symptoms || [],
      notes: entryData.notes || '',
      type: entryData.type || 'none',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(cycleRef, docId), cycleEntry);
    
    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));
    
    return { id: docId, ...cycleEntry };
  } catch (error) {
    console.error("Error saving cycle entry:", error);
    const userFriendlyMessage = getErrorMessage(error);
    const friendlyError = new Error(userFriendlyMessage);
    friendlyError.code = error.code;
    friendlyError.originalError = error;
    throw friendlyError;
  }
};

// Get all cycle data for a user
export const getCycleData = async (userId) => {
  try {
    // Use simple query without orderBy to avoid index requirements
    const q = query(cycleRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    // Convert to object with date keys for easy lookup and sort in memory
    const cycleData = {};
    const entries = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        ...data
      });
    });
    
    // Sort by date in memory
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Convert to object format
    entries.forEach(entry => {
      cycleData[entry.date] = entry;
    });
    
    return cycleData;
  } catch (error) {
    console.error("Error fetching cycle data:", error);
    throw error;
  }
};

// Get cycle data for a specific date range
export const getCycleDataForRange = async (userId, startDate, endDate) => {
  try {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const q = query(
      cycleRef,
      where("userId", "==", userId),
      where("date", ">=", startDateStr),
      where("date", "<=", endDateStr),
      orderBy("date", "asc")
    );
    
    const snapshot = await getDocs(q);
    const cycleData = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      cycleData[data.date] = {
        id: doc.id,
        ...data
      };
    });
    
    return cycleData;
  } catch (error) {
    console.error("Error fetching cycle data for range:", error);
    throw error;
  }
};

// Delete cycle entry for a specific date
export const deleteCycleEntry = async (userId, date) => {
  try {
    const dateKey = date.toISOString().split('T')[0];
    const docId = `${userId}_${dateKey}`;
    
    await deleteDoc(doc(cycleRef, docId));
    
    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));
    
    return true;
  } catch (error) {
    console.error("Error deleting cycle entry:", error);
    throw error;
  }
};

// Get cycle statistics
export const getCycleStats = async (userId) => {
  try {
    // Get all cycle entries for the user with simple query
    const q = query(cycleRef, where("userId", "==", userId));
    
    const snapshot = await getDocs(q);
    const allEntries = snapshot.docs.map(doc => doc.data());
    
    // Sort and filter period entries in memory
    const periodEntries = allEntries
      .filter(entry => entry.periodStatus && ["start", "ongoing", "end"].includes(entry.periodStatus))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate cycle statistics
    const stats = {
      totalCycles: 0,
      averageCycleLength: 28,
      averagePeriodLength: 5,
      lastPeriodStart: null,
      nextPredictedPeriod: null,
      currentCycleDay: 1,
      currentPhase: 'Follicular'
    };
    
    if (periodEntries.length > 0) {
      console.log('🔍 All Period Entries:', periodEntries.map(e => ({
        date: e.date,
        periodStatus: e.periodStatus,
        flow: e.flow
      })));
      
      // Find period starts to calculate cycles
      // Look for entries marked as 'start' OR first period entry in a sequence
      const periodStarts = [];
      
      // First, get all entries marked as 'start'
      const explicitStarts = periodEntries.filter(entry => entry.periodStatus === 'start');
      periodStarts.push(...explicitStarts);
      
      // Also look for the first period entry in each month (might be marked as 'ongoing' but is actually a start)
      const monthlyFirstPeriods = [];
      const entriesByMonth = {};
      
      periodEntries.forEach(entry => {
        const monthKey = entry.date.substring(0, 7); // YYYY-MM
        if (!entriesByMonth[monthKey]) {
          entriesByMonth[monthKey] = [];
        }
        entriesByMonth[monthKey].push(entry);
      });
      
      // For each month, find the earliest period entry
      Object.values(entriesByMonth).forEach(monthEntries => {
        const sortedMonthEntries = monthEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstEntry = sortedMonthEntries[0];
        
        // If this is a period entry and we don't already have a start for this month
        if (firstEntry && !periodStarts.some(p => p.date === firstEntry.date)) {
          monthlyFirstPeriods.push(firstEntry);
        }
      });
      
      periodStarts.push(...monthlyFirstPeriods);
      
      // Sort all period starts by date
      const allPeriodStarts = periodStarts
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log('🔍 All Period Starts Found:', allPeriodStarts.map(s => ({
        date: s.date,
        periodStatus: s.periodStatus
      })));
      
      if (allPeriodStarts.length > 0) {
        stats.lastPeriodStart = allPeriodStarts[0].date;
        
        // Calculate current cycle day
        const lastStart = new Date(allPeriodStarts[0].date);
        const today = new Date();
        stats.currentCycleDay = Math.floor((today - lastStart) / (1000 * 60 * 60 * 24)) + 1;
        
        // Predict next period (simple 28-day cycle)
        const nextPeriod = new Date(lastStart);
        nextPeriod.setDate(nextPeriod.getDate() + 28);
        stats.nextPredictedPeriod = nextPeriod.toISOString().split('T')[0];
        
        // Determine current phase
        if (stats.currentCycleDay <= 5) {
          stats.currentPhase = 'Menstrual';
        } else if (stats.currentCycleDay <= 13) {
          stats.currentPhase = 'Follicular';
        } else if (stats.currentCycleDay <= 15) {
          stats.currentPhase = 'Ovulation';
        } else {
          stats.currentPhase = 'Luteal';
        }
      }
      
      // Calculate average cycle length if we have multiple cycles
      if (allPeriodStarts.length > 1) {
        // Sort period starts chronologically (oldest first)
        const sortedStarts = [...allPeriodStarts].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let totalDays = 0;
        let cycleCount = 0;
        
        // Calculate cycle lengths between consecutive period starts
        console.log('🔍 Cycle Calculation Debug:', {
          totalPeriodStarts: sortedStarts.length,
          periodDates: sortedStarts.map(s => s.date)
        });
        
        for (let i = 1; i < sortedStarts.length; i++) {
          const current = new Date(sortedStarts[i].date);
          const previous = new Date(sortedStarts[i - 1].date);
          const cycleLength = Math.floor((current - previous) / (1000 * 60 * 60 * 24));
          
          console.log(`Cycle ${i}: ${previous.toDateString()} → ${current.toDateString()} = ${cycleLength} days`);
          
          // Only include reasonable cycle lengths (14-60 days)
          if (cycleLength >= 14 && cycleLength <= 60) {
            totalDays += cycleLength;
            cycleCount++;
          } else {
            console.log(`⚠️ Excluded cycle ${i}: ${cycleLength} days (outside 14-60 range)`);
          }
        }
        
        if (cycleCount > 0) {
          stats.averageCycleLength = Math.round(totalDays / cycleCount);
          stats.totalCycles = cycleCount;
          console.log(`✅ Final calculation: ${totalDays} total days ÷ ${cycleCount} cycles = ${stats.averageCycleLength} days average`);
        } else {
          // Fallback to default if no valid cycles found
          stats.averageCycleLength = 28;
          stats.totalCycles = 0;
          console.log('⚠️ No valid cycles found, using default 28 days');
        }
      }
    }
    
    return stats;
  } catch (error) {
    console.error("Error calculating cycle stats:", error);
    throw error;
  }
};

// Build recent cycles timeline data for charts
export const getRecentCycles = async (userId, count = 6) => {
  const data = await getCycleData(userId);
  const entries = Object.values(data)
    .filter(e => e.periodStatus && ["start","ongoing","end"].includes(e.periodStatus))
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  // Find starts
  const starts = entries.filter(e => e.periodStatus === 'start');
  const cycles = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const nextStart = starts[i+1];
    const endDate = nextStart ? new Date(nextStart.date) : new Date(start.date);
    const startDate = new Date(start.date);
    const cycleLength = Math.max(1, Math.floor((endDate - startDate) / (1000*60*60*24)));
    // period length: count entries from start until nextStart that are period type
    const periodDays = entries.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && (!nextStart || d < new Date(nextStart.date));
    }).length;
    // flow avg 1..3 based on flow field
    const flowMap = { light:1, medium:2, heavy:3 };
    const flows = entries
      .filter(e => {
        const d = new Date(e.date);
        return d >= startDate && (!nextStart || d < new Date(nextStart.date));
      })
      .map(e => flowMap[e.flow] || 0)
      .filter(v => v>0);
    const flowAvg = flows.length ? (flows.reduce((a,b)=>a+b,0)/flows.length) : 0;
    cycles.push({
      label: start.date.slice(5),
      cycleLength,
      periodLength: periodDays,
      flowAvg: parseFloat(flowAvg.toFixed(2))
    });
  }
  return cycles.slice(-count);
};

// Get most common symptoms
export const getCommonSymptoms = async (userId) => {
  try {
    const q = query(cycleRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const symptomCounts = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.symptoms && data.symptoms.length > 0) {
        data.symptoms.forEach(symptom => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        });
      }
    });
    
    // Sort symptoms by frequency
    const sortedSymptoms = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));
    
    return sortedSymptoms;
  } catch (error) {
    console.error("Error fetching common symptoms:", error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const addCycleEntry = async (userId, flow, symptoms, notes = "") => {
  const today = new Date();
  return await saveCycleEntry(userId, today, {
    periodStatus: 'ongoing',
    flow,
    symptoms,
    notes,
    type: 'period'
  });
};

// Get count of cycle entries for the current month
export const getCycleEntriesCountForMonth = async (userId, year, month) => {
  try {
    // First try the optimized query
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    try {
      const q = query(
        cycleRef,
        where("userId", "==", userId),
        where("createdAt", ">=", startDate),
        where("createdAt", "<", endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (indexError) {
      console.warn("Composite index not available, using client-side filtering:", indexError);

      // Fallback to client-side filtering
      const q = query(
        cycleRef,
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        if (createdAt >= startDate && createdAt < endDate) {
          count++;
        }
      });

      return count;
    }
  } catch (error) {
    console.error("Error fetching cycle entries count:", error);
    return 0; // Return 0 instead of throwing to prevent dashboard from breaking
  }
};

// Get user settings including conception date
export const getUserSettings = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user settings:", error);
    throw error;
  }
};
