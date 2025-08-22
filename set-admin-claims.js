// Script to set admin custom claims for the admin user
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You would need to add your service account key here
  // For now, we'll use the default credentials
};

// Initialize with default credentials (works in Firebase environment)
admin.initializeApp();

async function setAdminClaims() {
  try {
    const email = 'rajatmourya82@gmail.com';
    
    console.log('Setting admin custom claims for:', email);
    
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('Found user with UID:', user.uid);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log('✅ Successfully set admin custom claims for', email);
    console.log('The user now has admin privileges for Cloud Functions');
    
  } catch (error) {
    console.error('❌ Error setting admin claims:', error.message);
  }
}

setAdminClaims().then(() => {
  console.log('Script completed');
  process.exit(0);
});
