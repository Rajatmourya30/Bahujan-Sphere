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

async function addAdminUser() {
  try {
    // The UID for rajatmourya82@gmail.com - you'll need to get this from Firebase Auth console
    // For now, let's use a placeholder and instructions
    console.log('To add the admin user, you need to:');
    console.log('1. Go to Firebase Console > Authentication > Users');
    console.log('2. Find the user rajatmourya82@gmail.com');
    console.log('3. Copy their UID');
    console.log('4. Replace USER_UID_HERE in this script with the actual UID');
    console.log('5. Run this script again');
    
    const userUID = 'USER_UID_HERE'; // Replace with actual UID from Firebase Auth console
    
    if (userUID === 'USER_UID_HERE') {
      console.log('\nPlease update the userUID variable with the actual UID from Firebase Auth console.');
      return;
    }
    
    // Check if the user already exists in teamMembers
    const teamMemberRef = doc(db, 'teamMembers', userUID);
    const teamMemberDoc = await getDoc(teamMemberRef);
    
    if (teamMemberDoc.exists()) {
      console.log('Admin user already exists in teamMembers collection:', teamMemberDoc.data());
      return;
    }
    
    // Add the admin user to teamMembers collection
    await setDoc(teamMemberRef, {
      name: 'Rajat Mourya',
      email: 'rajatmourya82@gmail.com',
      role: 'Admin',
      joinedAt: serverTimestamp()
    });
    
    console.log('Successfully added admin user to teamMembers collection!');
    
  } catch (error) {
    console.error('Error adding admin user:', error);
  }
}

addAdminUser();
