# 🔧 Firebase Storage Permission Fix

## 🚨 Issue
**Error**: `Firebase Storage: User does not have permission to access 'images/events/1755898736575-angelo brewing (45).png'. (storage/unauthorized)`

## 🔍 Root Cause
The user trying to upload images is not properly recognized as a team member in the Firebase Storage security rules.

## ✅ Solution Steps

### 1. **Verify User Authentication**
The user must be logged in and their UID must exist in the `teamMembers` collection.

### 2. **Check Team Member Status**
Run this in browser console on the admin page:
```javascript
// Check current user status
import { auth, db } from './src/lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('User UID:', user.uid);
    console.log('User Email:', user.email);
    
    const teamDoc = await getDoc(doc(db, 'teamMembers', user.uid));
    console.log('Is team member:', teamDoc.exists());
    if (teamDoc.exists()) {
      console.log('Role:', teamDoc.data().role);
    }
  }
});
```

### 3. **Fix Missing Team Member Document**
If the user is not in `teamMembers` collection, add them:

```javascript
// Add current user to teamMembers collection
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
  console.log('✅ User added to teamMembers collection');
}
```

### 4. **Verify Storage Rules**
Current storage rules (already deployed):
```javascript
// Events images
match /images/events/{fileName} {
  allow read;
  allow write: if isTeamMember();
}

// Helper function
function isTeamMember() {
  return exists(/databases/(default)/documents/teamMembers/$(request.auth.uid));
}
```

## 🎯 Quick Fix Commands

### Option A: Use the Admin Panel
1. Go to `/admin/team`
2. Click "Add Team Member"
3. Check "Create New User Account" 
4. Add yourself with your current email and a password
5. This will ensure you're in the teamMembers collection

### Option B: Manual Database Fix
1. Go to Firebase Console → Firestore Database
2. Navigate to `teamMembers` collection
3. Add a document with ID = your Firebase Auth UID
4. Set fields:
   - `name`: Your name
   - `email`: Your email
   - `role`: "Admin"
   - `joinedAt`: Current timestamp

### Option C: Use Fix Script
1. Copy the content of `fix-storage-permissions.js`
2. Run it in browser console on admin page
3. It will automatically add you to teamMembers if missing

## 🔍 Debug Steps

### 1. Check Authentication
```javascript
console.log('Current user:', auth.currentUser);
```

### 2. Check Team Member Status
```javascript
const teamDoc = await getDoc(doc(db, 'teamMembers', auth.currentUser.uid));
console.log('Team member exists:', teamDoc.exists());
```

### 3. Test Storage Upload
After fixing team member status, try uploading an image again.

## ✅ Expected Result
After fixing the team member status:
- ✅ User can upload images to `images/events/`
- ✅ User can upload images to `images/logos/`
- ✅ User can upload images to `images/stores/`
- ✅ User can upload PDFs to `pdfs/`
- ✅ User can upload book covers to `bookCovers/`

## 🛡️ Security Notes
- Only team members can upload to public content folders
- Users can only upload to their own profile picture folder
- All uploads require authentication
- Storage rules are properly configured and deployed

## 📝 Files Created
- `debug-storage-permissions.js` - Diagnostic script
- `fix-storage-permissions.js` - Automatic fix script
- `STORAGE_PERMISSION_FIX.md` - This documentation

The storage permission issue should be resolved once the user is properly added to the `teamMembers` collection with their correct Firebase Auth UID.
