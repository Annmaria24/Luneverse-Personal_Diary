import { db } from "../firebase/config";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

const cycleRef = collection(db, "cycleEntries");

export const addCycleEntry = async (userId, flow, symptoms, notes = "") => {
  const docRef = await addDoc(cycleRef, {
    userId,
    flow,
    symptoms,
    notes,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date(),
  });
  
  // Trigger dashboard update
  window.dispatchEvent(new Event('dashboardDataUpdated'));
  
  return docRef;
};

export const getCycleData = async (userId) => {
  const q = query(cycleRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get count of cycle entries for the current month
export const getCycleEntriesCountForMonth = async (userId, year, month) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);
    const q = query(
      cycleRef,
      where("userId", "==", userId),
      where("createdAt", ">=", startDate),
      where("createdAt", "<", endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error fetching cycle entries count:", error);
    throw error;
  }
};
