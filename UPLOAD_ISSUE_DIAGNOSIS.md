# Upload Issue Diagnosis and Fix

## Problem Summary
Users are unable to upload images and PDFs to the application. The issue appears to be related to Firebase Storage permissions and team member verification.

## Root Cause Analysis

### 1. Storage Rules Mismatch
**Issue**: The storage rules were checking for team members using UID as document ID (`/teamMembers/$(request.auth.uid)`), but the upload form was verifying team membership by querying the email field.

**Fix Applied**: Updated storage rules to support both custom claims and direct UID-based document lookup.

### 2. Team Member Verification Logic
**Issue**: The upload form was using a query to find team members by email, which doesn't align with storage rules that expect UID-based documents.

**Fix Applied**: Updated the upload form to first check for team member documents using UID as document ID, with email query as fallback.

## Files Modified

### 1. `storage.rules`
```javascript
// BEFORE: Only checked by UID document existence
function isTeamMember() {
  return exists(/databases/(default)/documents/teamMembers/$(request.auth.uid));
}

// AFTER: Multiple verification methods
function isTeamMember() {
  return request.auth != null && 
         request.auth.token != null && 
         request.auth.token.teamMember == true;
}

function isTeamMemberByEmail() {
  return request.auth != null && 
         request.auth.token != null && 
         request.auth.token.email != null &&
         exists(/databases/(default)/documents/teamMembers/$(request.auth.uid));
}
```

### 2. `firestore.rules`
```javascript
// Enhanced team member document access
match /teamMembers/{userId} {
  allow get: if isSignedIn() && (isOwner(userId) || isTeamMember());
  allow list: if isTeamMember();
  allow write: if isTeamMember();
  allow read: if isOwner(userId); // Added for team member verification
}
```

### 3. `ImprovedReadingRoomSubmissionForm.tsx`
```javascript
// BEFORE: Only email-based query
const teamQuery = query(collection(db, "teamMembers"), where("email", "==", currentUser.email));

// AFTER: UID-first approach with email fallback
const teamMemberDocRef = doc(db, "teamMembers", currentUser.uid);
const teamMemberDoc = await getDoc(teamMemberDocRef);

if (teamMemberDoc.exists()) {
  // Use UID-based document
} else {
  // Fallback to email query for legacy users
}
```

## Deployment Steps

1. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

2. **Verify Team Member Documents**:
   - Ensure all team members have documents with their UID as the document ID
   - The team creation process already does this correctly via `setDoc(doc(db, 'teamMembers', uid), ...)`

## Testing Checklist

### Pre-Upload Verification
- [ ] User is authenticated
- [ ] User has team member document with UID as document ID
- [ ] User role is properly set
- [ ] Storage rules are deployed

### Upload Process Testing
- [ ] PDF file validation (type, size)
- [ ] Image file validation (type, size)
- [ ] Storage upload permissions
- [ ] Firestore document creation
- [ ] Progress tracking works

### Error Handling
- [ ] Clear error messages for unauthorized users
- [ ] Proper error handling for storage failures
- [ ] Fallback verification for legacy team members

## Common Issues and Solutions

### Issue: "storage/unauthorized" Error
**Cause**: User not properly verified as team member
**Solution**: 
1. Check if user document exists at `/teamMembers/{uid}`
2. Verify storage rules are deployed
3. Ensure user is authenticated

### Issue: Team Member Not Found
**Cause**: Team member document stored with auto-generated ID instead of UID
**Solution**: 
1. Use the enhanced verification logic that checks both methods
2. Consider migrating legacy documents to use UID as document ID

### Issue: Upload Starts But Fails
**Cause**: Storage rules deployed but Firestore rules not updated
**Solution**: Deploy both rule sets together

## Monitoring and Debugging

### Console Logs to Check
```javascript
// In upload form
console.log('User authenticated as team member:', userData.role);
console.log('Team member document not found by UID, trying email query...');

// In storage upload
console.log('Upload progress:', progress);
console.log('Upload completed successfully:', downloadURL);
```

### Firebase Console Checks
1. **Authentication**: Verify user is signed in
2. **Firestore**: Check team member document exists at correct path
3. **Storage**: Verify files are being uploaded to correct paths
4. **Rules**: Ensure rules are deployed and active

## Next Steps After Deployment

1. Test upload functionality with different user roles
2. Verify both new and legacy team members can upload
3. Monitor error logs for any remaining issues
4. Consider implementing custom claims for better performance

## Custom Claims Implementation (Future Enhancement)

For better performance and reliability, consider implementing custom claims:

```javascript
// In Cloud Function when creating team member
await admin.auth().setCustomUserClaims(uid, { 
  teamMember: true, 
  role: role 
});
```

This would make storage rules more efficient and reliable.
