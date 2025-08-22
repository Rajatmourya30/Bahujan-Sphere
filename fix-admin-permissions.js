// Simple script to fix admin permissions
// Run this with: node fix-admin-permissions.js

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyg5huOpWkk0KZybL7U6c5rPGLvAw8ffM",
  authDomain: "bahujansphere-90sqv.firebaseapp.com",
  databaseURL: "https://bahujansphere-90sqv-default-rtdb.firebaseio.com",
  projectId: "bahujansphere-90sqv",
  storageBucket: "bahujansphere-90sqv.firebasestorage.app",
  messagingSenderId: "3324981248",
  appId: "1:3324981248:web:ac368f108131bf2bed68e5",
  measurementId: "G-K6QXH1FK7M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function fixAdminPermissions() {
  try {
    console.log('Please provide the admin user credentials:');
    console.log('Email: rajatmourya82@gmail.com');
    
    // You'll need to provide the password
    const email = 'rajatmourya82@gmail.com';
    const password = process.argv[2]; // Pass password as command line argument
    
    if (!password) {
      console.log('Usage: node fix-admin-permissions.js <password>');
      console.log('Example: node fix-admin-permissions.js your_password_here');
      return;
    }
    
    // Sign in the user
    console.log('Signing in user...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User signed in successfully:', user.uid);
    
    // Add the user to teamMembers collection
    console.log('Adding user to teamMembers collection...');
    await setDoc(doc(db, 'teamMembers', user.uid), {
      name: 'Rajat Mourya',
      email: user.email,
      role: 'Admin',
      joinedAt: serverTimestamp()
    });
    
    console.log('✅ Successfully added admin user to teamMembers collection!');
    console.log('User UID:', user.uid);
    console.log('Email:', user.email);
    console.log('Role: Admin');
    
    console.log('\nYou can now login to the admin panel at /admin/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\nThe user does not exist. Please create the user first in Firebase Console.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('\nIncorrect password provided.');
    } else if (error.code === 'auth/invalid-credential') {
      console.log('\nInvalid credentials provided.');
    }
  }
}

fixAdminPermissions().then(() => {
  console.log('\nScript completed');
  process.exit(0);
});
