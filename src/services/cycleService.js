import { db } from "../firebase/config";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

const cycleRef = collection(db, "cycleEntries");

export const addCycleEntry = async (userId, flow, symptoms, notes = "") => {
  return await addDoc(cycleRef, {
    userId,
    flow,
    symptoms,
    notes,
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date(),
  });
};

export const getCycleData = async (userId) => {
  const q = query(cycleRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
