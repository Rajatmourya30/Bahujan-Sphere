// Debug script to check storage permissions
import { auth, db } from './src/lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

console.log('🔍 Debugging Storage Permissions...');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('✅ User is authenticated:');
    console.log('  - UID:', user.uid);
    console.log('  - Email:', user.email);
    
    // Check if user exists in teamMembers collection
    try {
      const teamMemberDoc = await getDoc(doc(db, 'teamMembers', user.uid));
      if (teamMemberDoc.exists()) {
        console.log('✅ User is a team member:');
        console.log('  - Role:', teamMemberDoc.data().role);
        console.log('  - Name:', teamMemberDoc.data().name);
        console.log('  - Storage permissions should work for images/events/');
      } else {
        console.log('❌ User is NOT in teamMembers collection');
        console.log('  - This is why storage upload is failing');
        console.log('  - User needs to be added to teamMembers collection');
      }
    } catch (error) {
      console.error('❌ Error checking team member status:', error);
    }
  } else {
    console.log('❌ User is not authenticated');
    console.log('  - Please login first');
  }
});

// Instructions
console.log('\n📋 To fix storage permission issues:');
console.log('1. Make sure user is logged in');
console.log('2. Make sure user exists in teamMembers collection');
console.log('3. User document ID should match their Firebase Auth UID');
console.log('4. Run this script in browser console on admin page');
