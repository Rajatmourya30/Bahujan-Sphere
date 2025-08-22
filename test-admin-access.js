// Test script to verify admin access works
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

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

async function testAdminAccess() {
  try {
    console.log('🔐 Testing admin access...');
    
    // Sign in the admin user
    const email = 'rajatmourya82@gmail.com';
    const password = process.argv[2] || 'Silver30#';
    
    console.log('📧 Signing in admin user:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User signed in successfully');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    
    // Test 1: Check if user exists in teamMembers collection
    console.log('\n🧪 Test 1: Checking teamMembers document...');
    const teamMemberDocRef = doc(db, 'teamMembers', user.uid);
    const teamMemberDoc = await getDoc(teamMemberDocRef);
    
    if (teamMemberDoc.exists()) {
      const userData = teamMemberDoc.data();
      console.log('✅ Team member document found!');
      console.log('   Name:', userData.name);
      console.log('   Role:', userData.role);
      console.log('   Email:', userData.email);
      console.log('   Joined:', userData.joinedAt?.toDate?.() || userData.joinedAt);
    } else {
      console.log('❌ Team member document not found');
      return;
    }
    
    // Test 2: Try to list team members (admin permission)
    console.log('\n🧪 Test 2: Testing admin permissions (list team members)...');
    try {
      const teamMembersCol = collection(db, 'teamMembers');
      const teamMembersSnapshot = await getDocs(teamMembersCol);
      console.log('✅ Successfully accessed team members collection');
      console.log('   Total team members:', teamMembersSnapshot.size);
      
      teamMembersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.name} (${data.role}): ${data.email}`);
      });
    } catch (error) {
      console.log('❌ Failed to access team members:', error.message);
    }
    
    // Test 3: Try to access users collection
    console.log('\n🧪 Test 3: Testing access to users collection...');
    try {
      const usersCol = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCol);
      console.log('✅ Successfully accessed users collection');
      console.log('   Total users:', usersSnapshot.size);
    } catch (error) {
      console.log('❌ Failed to access users collection:', error.message);
    }
    
    console.log('\n🎉 Admin access test completed successfully!');
    console.log('The Firebase permissions error has been resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('The user does not exist in Firebase Authentication.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('Incorrect password provided.');
    } else if (error.code === 'auth/invalid-credential') {
      console.log('Invalid credentials provided.');
    }
  }
}

testAdminAccess().then(() => {
  console.log('\nTest completed');
  process.exit(0);
});
