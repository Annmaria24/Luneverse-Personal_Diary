// config.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvG0eVhq1n_6vxh-IKp0_gL9kjyoLHKaY",
  authDomain: "luneverse.firebaseapp.com",
  projectId: "luneverse",
  storageBucket: "luneverse.firebasestorage.app",
  messagingSenderId: "231968904417",
  appId: "1:231968904417:web:801233f76dc7371011d3a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Create Auth Instance
const auth = getAuth(app);

// ✅ Set persistence AFTER defining auth
setPersistence(auth, browserLocalPersistence);

// ✅ Export Services
export { auth };
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
