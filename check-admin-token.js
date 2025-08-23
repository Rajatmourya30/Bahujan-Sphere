const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'bahujansphere-90sqv'
  });
}

async function checkAdminToken() {
  try {
    // Get all users and find admin users
    const listUsersResult = await admin.auth().listUsers();
    
    console.log('Checking all users for admin claims...\n');
    
    for (const userRecord of listUsersResult.users) {
      console.log(`User: ${userRecord.email || userRecord.uid}`);
      console.log(`UID: ${userRecord.uid}`);
      console.log(`Custom Claims:`, userRecord.customClaims || 'None');
      
      // Check if this user has admin role in Firestore
      try {
        const teamMemberDoc = await admin.firestore()
          .collection('teamMembers')
          .doc(userRecord.uid)
          .get();
        
        if (teamMemberDoc.exists) {
          const data = teamMemberDoc.data();
          console.log(`Firestore Role: ${data.role || 'None'}`);
          
          // If user has Admin/Manager role in Firestore but no custom claims, fix it
          if ((data.role === 'Admin' || data.role === 'Manager') && !userRecord.customClaims?.role) {
            console.log(`⚠️  Fixing custom claims for ${userRecord.email || userRecord.uid}...`);
            await admin.auth().setCustomUserClaims(userRecord.uid, { role: data.role });
            console.log(`✅ Custom claims set: role = ${data.role}`);
          }
        } else {
          console.log('Firestore Role: Not found in teamMembers collection');
        }
      } catch (error) {
        console.log('Error checking Firestore:', error.message);
      }
      
      console.log('---\n');
    }
    
    console.log('✅ Admin token check complete!');
    console.log('\n🔄 Please refresh your browser and try again.');
    
  } catch (error) {
    console.error('Error checking admin tokens:', error);
  }
}

checkAdminToken();
