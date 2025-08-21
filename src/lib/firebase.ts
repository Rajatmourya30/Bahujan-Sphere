// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyg5huOpWkk0KZybL7U6c5rPGLvAw8ffM",
  authDomain: "bahujansphere-90sqv.firebaseapp.com",
  databaseURL: "https://bahujansphere-90sqv-default-rtdb.firebaseio.com",
  projectId: "bahujansphere-90sqv",
  storageBucket: "bahujansphere-90sqv.appspot.com",
  messagingSenderId: "3324981248",
  appId: "1:3324981248:web:ac368f108131bf2bed68e5",
  measurementId: "G-K6QXH1FK7M"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };
