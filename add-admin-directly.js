// Script to add admin user directly using Firebase CLI authentication
// This script will use the current Firebase CLI authentication

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');

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
const db = getFirestore(app);

async function addAdminDirectly() {
  try {
    // You need to provide the UID of the user rajatmourya82@gmail.com
    // Get this from Firebase Console > Authentication > Users
    const adminUID = process.argv[2];
    
    if (!adminUID) {
      console.log('❌ Please provide the admin user UID as an argument');
      console.log('Usage: node add-admin-directly.js <USER_UID>');
      console.log('');
      console.log('To get the UID:');
      console.log('1. Go to Firebase Console > Authentication > Users');
      console.log('2. Find rajatmourya82@gmail.com');
      console.log('3. Copy the UID and run: node add-admin-directly.js <UID>');
      return;
    }
    
    console.log('Adding admin user to teamMembers collection...');
    console.log('UID:', adminUID);
    
    // Check if user already exists
    const teamMemberRef = doc(db, 'teamMembers', adminUID);
    const existingDoc = await getDoc(teamMemberRef);
    
    if (existingDoc.exists()) {
      console.log('✅ Admin user already exists in teamMembers collection!');
      console.log('Data:', existingDoc.data());
      return;
    }
    
    // Add the admin user to teamMembers collection
    await setDoc(teamMemberRef, {
      name: 'Rajat Mourya',
      email: 'rajatmourya82@gmail.com',
      role: 'Admin',
      joinedAt: serverTimestamp()
    });
    
    console.log('✅ Successfully added admin user to teamMembers collection!');
    console.log('User UID:', adminUID);
    console.log('Email: rajatmourya82@gmail.com');
    console.log('Role: Admin');
    
    console.log('\n🎉 Admin user can now login at /admin/login');
    
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 This might be a permissions issue.');
      console.log('Make sure the Firestore rules have been deployed correctly.');
    }
  }
}

addAdminDirectly().then(() => {
  console.log('\nScript completed');
  process.exit(0);
});
