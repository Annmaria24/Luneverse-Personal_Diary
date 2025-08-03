import { db } from "../firebase/config";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

const moodRef = collection(db, "moodEntries");

export const addMoodEntry = async (userId, mood, note = "") => {
  return await addDoc(moodRef, {
    userId,
    mood,
    note,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date(),
  });
};

export const getMoodHistory = async (userId) => {
  const q = query(moodRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
