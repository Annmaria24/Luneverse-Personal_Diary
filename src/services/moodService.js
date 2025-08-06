import { db } from "../firebase/config";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

const moodRef = collection(db, "moodEntries");

export const addMoodEntry = async (userId, mood, note = "") => {
  const docRef = await addDoc(moodRef, {
    userId,
    mood,
    note,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date(),
  });
  
  // Trigger dashboard update
  window.dispatchEvent(new Event('dashboardDataUpdated'));
  
  return docRef;
};

export const getMoodHistory = async (userId) => {
  const q = query(moodRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get count of mood entries for the current month
export const getMoodEntriesCountForMonth = async (userId, year, month) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);
    const q = query(
      moodRef,
      where("userId", "==", userId),
      where("createdAt", ">=", startDate),
      where("createdAt", "<", endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching mood entries count:", error);
    throw error;
  }
};
