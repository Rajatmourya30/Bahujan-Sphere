// Script to get the admin user UID from Firebase Auth
const admin = require('firebase-admin');

// Initialize Firebase Admin (this will use the default service account)
try {
  admin.initializeApp();
} catch (error) {
  // App might already be initialized
}

async function getAdminUID() {
  try {
    console.log('🔍 Looking for admin user: rajatmourya82@gmail.com');
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail('rajatmourya82@gmail.com');
    
    console.log('✅ Found admin user!');
    console.log('UID:', userRecord.uid);
    console.log('Email:', userRecord.email);
    console.log('Display Name:', userRecord.displayName || 'Not set');
    
    // Now add to teamMembers collection
    const db = admin.firestore();
    const teamMemberRef = db.collection('teamMembers').doc(userRecord.uid);
    
    // Check if already exists
    const existingDoc = await teamMemberRef.get();
    if (existingDoc.exists) {
      console.log('✅ User already exists in teamMembers collection');
      console.log('Data:', existingDoc.data());
    } else {
      console.log('🔧 Adding user to teamMembers collection...');
      
      await teamMemberRef.set({
        name: userRecord.displayName || 'Rajat Mourya',
        email: userRecord.email,
        role: 'Admin',
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ SUCCESS! Admin user added to teamMembers collection');
    }
    
    console.log('\n🎉 Storage permissions should now work!');
    console.log('Try uploading an image again.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 User not found in Firebase Auth.');
      console.log('Please make sure rajatmourya82@gmail.com is registered in Firebase Authentication.');
    }
  }
}

getAdminUID().then(() => {
  console.log('\nScript completed');
  process.exit(0);
});
