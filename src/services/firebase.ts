// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhEjBsdXq1GYbz9IDkzj2fULj-IrC-PE4",
  authDomain: "pacematch-gps.firebaseapp.com",
  databaseURL: "https://pacematch-gps-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "pacematch-gps",
  storageBucket: "pacematch-gps.firebasestorage.app",
  messagingSenderId: "891545961086",
  appId: "1:891545961086:web:9842aed06947710b5d0e2f",
  measurementId: "G-EPQ2M5BR6F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Note: COOP warnings from Firebase Auth popup are harmless and don't affect functionality
// They occur due to browser security policies but sign-in still works correctly

export default app;

