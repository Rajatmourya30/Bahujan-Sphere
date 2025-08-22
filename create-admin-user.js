const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to download the service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate new private key
const serviceAccount = require('./serviceAccountKey.json'); // You need to add this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bahujansphere-90sqv-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function createAdminUser() {
  try {
    // First, let's find the user by email in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail('rajatmourya82@gmail.com');
    console.log('Found user:', userRecord.uid, userRecord.email);
    
    // Add the user to teamMembers collection
    await db.collection('teamMembers').doc(userRecord.uid).set({
      name: 'Rajat Mourya',
      email: 'rajatmourya82@gmail.com',
      role: 'Admin',
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Successfully added admin user to teamMembers collection!');
    console.log('User UID:', userRecord.uid);
    
  } catch (error) {
    console.error('Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\nThe user rajatmourya82@gmail.com does not exist in Firebase Auth.');
      console.log('Please create the user first in Firebase Console > Authentication > Users');
    }
  }
}

createAdminUser().then(() => {
  console.log('Script completed');
  process.exit(0);
});
