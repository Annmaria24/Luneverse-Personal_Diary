// config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
