// IMMEDIATE FIX for Storage Permission Issue
// Copy and paste this entire script into browser console on the admin page

console.log('🔧 IMMEDIATE STORAGE PERMISSION FIX');
console.log('==================================');

// Import Firebase modules (these should be available on the admin page)
const { auth, db } = window;
const { doc, setDoc, getDoc, serverTimestamp } = window;

if (!auth || !db) {
  console.error('❌ Firebase not loaded. Make sure you are on the admin page.');
} else {
  console.log('✅ Firebase modules loaded');
  
  // Function to fix storage permissions
  async function fixStoragePermissions() {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        console.error('❌ No user logged in. Please login first.');
        return;
      }
      
      console.log('👤 Current user:', user.email, 'UID:', user.uid);
      
      // Check if user exists in teamMembers
      const teamMemberRef = doc(db, 'teamMembers', user.uid);
      const teamMemberDoc = await getDoc(teamMemberRef);
      
      if (teamMemberDoc.exists()) {
        console.log('✅ User already exists in teamMembers collection');
        console.log('   Role:', teamMemberDoc.data().role);
        console.log('   This should work for storage uploads');
        
        // Double-check by trying to read the document again
        const doubleCheck = await getDoc(teamMemberRef);
        console.log('🔍 Double-check exists:', doubleCheck.exists());
        
      } else {
        console.log('🔧 Adding user to teamMembers collection...');
        
        // Add user to teamMembers collection
        await setDoc(teamMemberRef, {
          name: user.displayName || user.email.split('@')[0] || 'Admin User',
          email: user.email,
          role: 'Admin',
          joinedAt: serverTimestamp()
        });
        
        console.log('✅ SUCCESS! User added to teamMembers collection');
        
        // Verify the addition
        const verifyDoc = await getDoc(teamMemberRef);
        if (verifyDoc.exists()) {
          console.log('✅ VERIFIED: User now exists in teamMembers');
          console.log('   Data:', verifyDoc.data());
        }
      }
      
      console.log('');
      console.log('🎯 NEXT STEPS:');
      console.log('1. Refresh the page');
      console.log('2. Try uploading an image to events again');
      console.log('3. It should work now!');
      
    } catch (error) {
      console.error('❌ Error fixing permissions:', error);
      console.log('');
      console.log('🔧 MANUAL FIX:');
      console.log('1. Go to Firebase Console');
      console.log('2. Navigate to Firestore Database');
      console.log('3. Go to teamMembers collection');
      console.log('4. Add document with ID:', auth.currentUser?.uid);
      console.log('5. Set fields: name, email, role: "Admin", joinedAt: timestamp');
    }
  }
  
  // Run the fix
  fixStoragePermissions();
}
