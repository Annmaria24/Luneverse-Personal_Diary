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
  updateDoc
} from "firebase/firestore";
import { getErrorMessage } from "../utils/errorMessages";

const pregnancyRef = collection(db, "pregnancyEntries");


// Add or update pregnancy entry for a specific date
export const savePregnancyEntry = async (userId, date, entryData) => {
  try {
    const dateKey = date.toISOString().split('T')[0];
    const docId = `${userId}_${dateKey}`;

    const pregnancyEntry = {
      userId,
      date: dateKey,
      pregnancyWeek: entryData.pregnancyWeek || 1,
      trimester: entryData.trimester || 1,
      symptoms: entryData.symptoms || [],
      notes: entryData.notes || '',
      doctorAppointments: entryData.doctorAppointments || [],
      babyGrowthInfo: entryData.babyGrowthInfo || '',
      type: 'pregnancy',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(pregnancyRef, docId), pregnancyEntry);

    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));

    return { id: docId, ...pregnancyEntry };
  } catch (error) {
    console.error("Error saving pregnancy entry:", error);
    const userFriendlyMessage = getErrorMessage(error);
    const friendlyError = new Error(userFriendlyMessage);
    friendlyError.code = error.code;
    friendlyError.originalError = error;
    throw friendlyError;
  }
};

// Get all pregnancy data for a user
export const getPregnancyData = async (userId) => {
  try {
    const q = query(pregnancyRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const pregnancyData = {};
    const entries = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        ...data
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    entries.forEach(entry => {
      pregnancyData[entry.date] = entry;
    });

    return pregnancyData;
  } catch (error) {
    console.error("Error fetching pregnancy data:", error);
    throw error;
  }
};

// Delete pregnancy entry for a specific date
export const deletePregnancyEntry = async (userId, date) => {
  try {
    const dateKey = date.toISOString().split('T')[0];
    const docId = `${userId}_${dateKey}`;

    await deleteDoc(doc(pregnancyRef, docId));

    // Trigger dashboard update
    window.dispatchEvent(new Event('dashboardDataUpdated'));

    return true;
  } catch (error) {
    console.error("Error deleting pregnancy entry:", error);
    throw error;
  }
};

// Get pregnancy statistics
export const getPregnancyStats = async (userId) => {
  try {
    // Import getUserSettings to get conception date
    const { getUserSettings } = await import('./userService');

    const q = query(pregnancyRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const allEntries = snapshot.docs.map(doc => doc.data());

    const stats = {
      totalEntries: allEntries.length,
      currentWeek: 0,
      currentTrimester: 1,
      commonSymptoms: [],
      lastEntry: null,
      nextAppointment: null,
      conceptionDate: null
    };

    if (allEntries.length > 0) {
      // Sort by date
      allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

      stats.lastEntry = allEntries[0].date;

      // Get conception date from user settings
      const userSettings = await getUserSettings(userId);
      const conceptionDate = userSettings?.conceptionDate;

      if (conceptionDate) {
        // Calculate current week based on conception date
        stats.currentWeek = calculatePregnancyWeek(conceptionDate, true);
        stats.conceptionDate = conceptionDate;
      } else {
        // Fallback to manual entry week if no conception date
        stats.currentWeek = allEntries[0].pregnancyWeek || 1;
      }

      stats.currentTrimester = getTrimester(stats.currentWeek);

      // Find next appointment
      const appointments = allEntries.flatMap(entry => entry.doctorAppointments || []);
      if (appointments.length > 0) {
        const futureAppointments = appointments
          .filter(app => new Date(app.date) > new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        if (futureAppointments.length > 0) {
          stats.nextAppointment = futureAppointments[0];
        }
      }

      // Calculate common symptoms
      const symptomCounts = {};
      allEntries.forEach(entry => {
        if (entry.symptoms && entry.symptoms.length > 0) {
          entry.symptoms.forEach(symptom => {
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
          });
        }
      });

      stats.commonSymptoms = Object.entries(symptomCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([symptom, count]) => ({ symptom, count }));
    }

    return stats;
  } catch (error) {
    console.error("Error calculating pregnancy stats:", error);
    throw error;
  }
};

// Get baby growth info based on pregnancy week
export const getBabyGrowthInfo = (week) => {
  const growthData = {
    1: { size: "Size of a poppy seed", weight: "Less than 1 gram", developments: ["Heart begins to beat", "Spinal cord and brain are forming"] },
    4: { size: "Size of a poppy seed", weight: "Less than 1 gram", developments: ["Major organs begin to form", "Placenta is developing"] },
    8: { size: "Size of a kidney bean", weight: "1 gram", developments: ["All major organs have begun to form", "Baby's heart beats steadily"] },
    12: { size: "Size of a lime", weight: "14 grams", developments: ["Baby can move and swallow", "Fingerprints are forming"] },
    16: { size: "Size of an avocado", weight: "100 grams", developments: ["Baby can hear your voice", "Hair and eyebrows are growing"] },
    20: { size: "Size of a banana", weight: "300 grams", developments: ["Baby can feel touch", "Lungs are developing"] },
    24: { size: "Size of corn on the cob", weight: "600 grams", developments: ["Baby practices breathing", "Brain is rapidly developing"] },
    28: { size: "Size of an eggplant", weight: "1 kg", developments: ["Eyes can open and close", "Lungs are maturing"] },
    32: { size: "Size of a squash", weight: "1.8 kg", developments: ["Baby can taste sweet and sour", "Brain is growing quickly"] },
    36: { size: "Size of a honeydew melon", weight: "2.7 kg", developments: ["Baby is gaining weight rapidly", "Lungs are nearly fully developed"] },
    40: { size: "Size of a watermelon", weight: "3.2 kg", developments: ["Baby is ready for birth", "All systems are developed"] }
  };

  return growthData[week] || { size: "Size varies", weight: "Weight varies", developments: ["Development in progress"] };
};

// Get pregnancy advice based on week and symptoms
export const getPregnancyAdvice = (week, symptoms = []) => {
  const advice = [];

  // General advice based on week
  if (week <= 12) {
    advice.push("Take prenatal vitamins daily");
    advice.push("Avoid raw or undercooked foods");
    advice.push("Stay hydrated and rest when needed");
  } else if (week <= 24) {
    advice.push("Continue prenatal care visits");
    advice.push("Monitor fetal movements");
    advice.push("Consider prenatal yoga or walking");
  } else {
    advice.push("Prepare for birth classes");
    advice.push("Discuss birth plan with healthcare provider");
    advice.push("Get plenty of rest and support");
  }

  // Advice based on symptoms
  if (symptoms.includes('nausea')) {
    advice.push("Eat small, frequent meals");
    advice.push("Try ginger tea or candies");
  }
  if (symptoms.includes('fatigue')) {
    advice.push("Take short naps when possible");
    advice.push("Light exercise may help energy levels");
  }
  if (symptoms.includes('back_pain')) {
    advice.push("Practice good posture");
    advice.push("Use pregnancy support belt if needed");
  }

  return advice;
};

// Calculate pregnancy week
// If isFromConception is true, dateArg is a conception date; otherwise it's a due date
export const calculatePregnancyWeek = (dateArg, isFromConception = false) => {
  if (!dateArg) return 0;
  const today = new Date();
  const reference = new Date(dateArg);
  let week = 0;

  if (isFromConception) {
    // Count strictly from conception day (Day 1..7 => Week 1)
    const elapsedDays = Math.max(0, Math.floor((today - reference) / (1000 * 60 * 60 * 24))) + 1;
    week = Math.ceil(elapsedDays / 7);
    if (week < 1) week = 0; // Early stage before week 1
  } else {
    // From due date – back-calculate weeks elapsed out of 280 days
    const diffDays = Math.ceil((reference - today) / (1000 * 60 * 60 * 24));
    const totalPregnancyDays = 280; // 40 weeks
    const daysElapsed = totalPregnancyDays - diffDays;
    week = Math.ceil(Math.max(0, daysElapsed) / 7);
  }

  return Math.max(0, Math.min(40, week));
};

// Get trimester from week
export const getTrimester = (week) => {
  if (week <= 12) return 1;
  if (week <= 26) return 2;
  return 3;
};

// Get count of pregnancy entries for the current month
export const getPregnancyEntriesCountForMonth = async (userId, year, month) => {
  try {
    // First try the optimized query
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    try {
      const q = query(
        pregnancyRef,
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
        pregnancyRef,
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
    console.error("Error fetching pregnancy entries count:", error);
    return 0; // Return 0 instead of throwing to prevent dashboard from breaking
  }
};
