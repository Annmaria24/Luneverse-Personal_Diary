import { db } from "../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * ✅ Creates a user profile in Firestore
 */
export const createUserProfile = async (user, isGoogleSignup = false) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      hasPassword: isGoogleSignup ? false : true, // ✅ Explicitly set based on signup method
    });
  }
};


/**
 * ✅ Get user profile
 */
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * ✅ Update last login timestamp
 */
export const updateLastLogin = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(
      userDocRef,
      { lastLogin: serverTimestamp() }, // ✅ Consistent with Firestore timestamps
      { merge: true }
    );
    console.log("✅ Updated last login for user:", uid);
  } catch (error) {
    console.error("Error updating last login:", error);
  }
};

/**
 * ✅ Get user settings
 */
export const getUserSettings = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error getting user settings:", error);
    throw error;
  }
};

/**
 * ✅ Save user settings
 */
export const saveUserSettings = async (uid, settings) => {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, settings, { merge: true });
    console.log("✅ Updated user settings for user:", uid);
  } catch (error) {
    console.error("Error saving user settings:", error);
    throw error;
  }
};
