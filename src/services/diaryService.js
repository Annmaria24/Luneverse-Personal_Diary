import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

// Add a new diary entry
export const addDiaryEntry = async (userId, entry) => {
  try {
    await addDoc(collection(db, "diaryEntries"), {
      userId,
      ...entry,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error adding diary entry:", error);
    throw error;
  }
};

// Get diary entries for a specific date
export const getDiaryEntries = async (userId, date) => {
  try {
    const q = query(
      collection(db, "diaryEntries"),
      where("userId", "==", userId),
      where("date", "==", date),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    throw error;
  }
};

// Delete a diary entry
export const deleteDiaryEntry = async (id) => {
  try {
    await deleteDoc(doc(db, "diaryEntries", id));
  } catch (error) {
    console.error("Error deleting diary entry:", error);
    throw error;
  }
};

// Update a diary entry
export const updateDiaryEntry = async (id, updatedData) => {
  try {
    const entryRef = doc(db, "diaryEntries", id);
    await updateDoc(entryRef, updatedData);
  } catch (error) {
    console.error("Error updating diary entry:", error);
    throw error;
  }
};
