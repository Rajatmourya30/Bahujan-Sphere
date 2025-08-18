// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "bahujansphere-90sqv",
  appId: "1:3324981248:web:ac368f108131bf2bed68e5",
  storageBucket: "bahujansphere-90sqv.firebasestorage.app",
  apiKey: "AIzaSyDyg5huOpWkk0KZybL7U6c5rPGLvAw8ffM",
  authDomain: "bahujansphere-90sqv.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "3324981248",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
