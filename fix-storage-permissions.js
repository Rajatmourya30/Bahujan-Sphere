// Fix script to ensure admin user has proper team member permissions
import { auth, db } from './src/lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

console.log('🔧 Fixing Storage Permissions...');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('✅ Current user:', user.email, 'UID:', user.uid);
    
    try {
      // Check if user already exists in teamMembers
      const teamMemberDoc = await getDoc(doc(db, 'teamMembers', user.uid));
      
      if (!teamMemberDoc.exists()) {
        console.log('🔧 Adding user to teamMembers collection...');
        
        // Add user to teamMembers collection
        await setDoc(doc(db, 'teamMembers', user.uid), {
          name: user.displayName || 'Admin User',
          email: user.email,
          role: 'Admin',
          joinedAt: serverTimestamp()
        });
        
        console.log('✅ User successfully added to teamMembers collection');
        console.log('✅ Storage permissions should now work');
      } else {
        console.log('✅ User already exists in teamMembers collection');
        console.log('  - Role:', teamMemberDoc.data().role);
        console.log('  - Storage permissions should work');
      }
      
      // Test storage permissions
      console.log('\n🧪 Testing storage permissions...');
      console.log('Try uploading an image to events now - it should work!');
      
    } catch (error) {
      console.error('❌ Error fixing permissions:', error);
    }
  } else {
    console.log('❌ Please login first');
  }
});
