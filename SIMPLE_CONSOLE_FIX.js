// SIMPLE CONSOLE FIX - Copy and paste this into browser console on admin page
// This uses the global Firebase objects that should be available

(async function() {
  console.log('🔧 FIXING STORAGE PERMISSIONS...');
  
  try {
    // Get Firebase objects from global scope
    const { auth, db } = window.firebase || window;
    const { doc, setDoc, getDoc, serverTimestamp } = window.firestore || window;
    
    if (!auth || !db) {
      console.error('❌ Firebase not available. Try this instead:');
      console.log(`
// Alternative fix - paste this:
import { auth, db } from './src/lib/firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const user = auth.currentUser;
if (user) {
  await setDoc(doc(db, 'teamMembers', user.uid), {
    name: user.displayName || 'Admin User',
    email: user.email,
    role: 'Admin',
    joinedAt: serverTimestamp()
  });
  console.log('✅ Fixed! Refresh page and try upload again.');
}
      `);
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ Please login first');
      return;
    }
    
    console.log('👤 User:', user.email, 'UID:', user.uid);
    
    // Add user to teamMembers
    await setDoc(doc(db, 'teamMembers', user.uid), {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      role: 'Admin',
      joinedAt: serverTimestamp()
    });
    
    console.log('✅ SUCCESS! User added to teamMembers');
    console.log('🔄 Please refresh the page and try uploading again');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('');
    console.log('🔧 MANUAL STEPS:');
    console.log('1. Go to https://console.firebase.google.com');
    console.log('2. Select your project');
    console.log('3. Go to Firestore Database');
    console.log('4. Navigate to "teamMembers" collection');
    console.log('5. Click "Add document"');
    console.log('6. Document ID: YOUR_FIREBASE_AUTH_UID');
    console.log('7. Add fields:');
    console.log('   - name: "Your Name"');
    console.log('   - email: "your@email.com"');
    console.log('   - role: "Admin"');
    console.log('   - joinedAt: timestamp');
  }
})();
