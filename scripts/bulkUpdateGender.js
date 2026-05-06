import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAllUsers() {
  console.log("🚀 Starting bulk gender update...");
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();

      // Skip admins
      if (data.isAdmin === true || data.role === 'admin') {
        process.stdout.write(`⏭️  Skipping admin: ${userDoc.id}\n`);
        skippedCount++;
        continue;
      }

      // Update to 'female'
      const userRef = doc(db, "users", userDoc.id);
      await updateDoc(userRef, { gender: "female" });
      updatedCount++;
    }

    console.log(`✅ Update complete! Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error("❌ Error during update:", error);
  }
}

updateAllUsers().then(() => process.exit(0));
