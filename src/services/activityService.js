import { db } from "../firebase/config";
import { addDoc, collection, doc, increment, serverTimestamp, setDoc, getDoc } from "firebase/firestore";

export const startSession = async (uid) => {
  const ref = await addDoc(collection(db, "activitySessions"), {
    uid,
    start: serverTimestamp(),
    end: null,
  });
  return ref.id;
};

export const endSession = async (sessionId) => {
  if (!sessionId) return;
  await setDoc(doc(db, "activitySessions", sessionId), { end: serverTimestamp() }, { merge: true });
};

export const recordAggregates = async (uid, minutes) => {
  const statsRef = doc(db, "adminStats", "activity");
  const snap = await getDoc(statsRef);
  if (!snap.exists()) {
    await setDoc(statsRef, { totalMinutes: 0, sessionCount: 0, averageSessionMinutes: 0 }, { merge: true });
  }
  await setDoc(
    statsRef,
    { totalMinutes: increment(minutes), sessionCount: increment(1) },
    { merge: true }
  );
  const updated = await getDoc(statsRef);
  const d = updated.data();
  const avg = d.sessionCount > 0 ? d.totalMinutes / d.sessionCount : 0;
  await setDoc(statsRef, { averageSessionMinutes: avg }, { merge: true });
};







