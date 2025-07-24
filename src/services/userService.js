import { db } from "../firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Creates a user profile in Firestore database
 * This should ONLY be called AFTER email verification
 */
export const createUserProfile = async (user) => {
  try {
    // Check if user profile already exists
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log("User profile already exists:", user.email);
      return userDoc.data();
    }

    // Create new user profile
    const userData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      profile: {
        // No personal data collected - privacy first
        preferences: {
          theme: "default",
          notifications: true
        }
      }
    };

    await setDoc(userDocRef, userData);
    console.log("✅ User profile created in Firestore:", user.email);
    return userData;

  } catch (error) {
    console.error("❌ Error creating user profile:", error);
    throw error;
  }
};

/**
 * Gets user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log("No user profile found for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * Updates user's last login time
 */
export const updateLastLogin = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      lastLoginAt: new Date()
    }, { merge: true });
    
    console.log("Updated last login for user:", uid);
  } catch (error) {
    console.error("Error updating last login:", error);
  }
};
