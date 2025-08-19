# Debug Firebase Permissions Issue

## 🚨 Current Status
**Error**: "Error fetching submissions: FirebaseError: Missing or insufficient permissions"
**Component**: `ReviewReadingRoomSubmissionsTab`
**Query**: `collection(db, "readingRoomSubmissions"), where("status", "==", "pending")`

## 🔍 Debugging Steps

### Step 1: Deploy the Rules
**CRITICAL**: The rules must be deployed to take effect!

```bash
# Make the script executable
chmod +x deploy-rules.sh

# Run the deployment
./deploy-rules.sh

# OR manually deploy
firebase deploy --only firestore:rules,storage
```

### Step 2: Verify User Authentication
Check if the user is properly authenticated:

```javascript
// Add this to the component for debugging
useEffect(() => {
  onAuthStateChanged(auth, (user) => {
    console.log("Current user:", user);
    console.log("User UID:", user?.uid);
    console.log("User email:", user?.email);
  });
}, []);
```

### Step 3: Check Team Member Document
Verify the user has a team member document:

```javascript
// Add this debugging code
useEffect(() => {
  const checkTeamMember = async () => {
    if (auth.currentUser) {
      try {
        const teamMemberDoc = await getDoc(doc(db, 'teamMembers', auth.currentUser.uid));
        console.log("Team member exists:", teamMemberDoc.exists());
        console.log("Team member data:", teamMemberDoc.data());
      } catch (error) {
        console.error("Error checking team member:", error);
      }
    }
  };
  checkTeamMember();
}, []);
```

### Step 4: Test Direct Collection Access
Try a simple read operation:

```javascript
// Add this test function
const testCollectionAccess = async () => {
  try {
    const testQuery = query(collection(db, "readingRoomSubmissions"), limit(1));
    const snapshot = await getDocs(testQuery);
    console.log("Collection access successful, docs:", snapshot.size);
  } catch (error) {
    console.error("Collection access failed:", error);
  }
};
```

### Step 5: Check Firebase Console
1. Go to Firebase Console → Firestore → Rules
2. Verify the rules show the latest version
3. Check the "Rules playground" to simulate the query

### Step 6: Verify Collection Exists
Check if the `readingRoomSubmissions` collection actually exists:
1. Go to Firebase Console → Firestore → Data
2. Look for the `readingRoomSubmissions` collection
3. If it doesn't exist, create a test document

## 🔧 Temporary Workaround Rules

I've temporarily opened the submission rules to all authenticated users:

```javascript
match /{submissionCollection}/{submissionId} where submissionCollection in [...] {
  allow read: if isSignedIn(); // Temporarily open
}
```

This should allow any authenticated user to read submissions while we debug.

## 🎯 Expected Behavior After Fix

1. **Authenticated users** should be able to read from `readingRoomSubmissions`
2. **The error should disappear** from the admin interface
3. **Public content security** should remain intact (only approved content visible)

## 🚨 If Issue Persists

If the error continues after deployment, the issue might be:

1. **Rules not deployed**: Check Firebase Console to verify latest rules
2. **User not authenticated**: Verify user login status
3. **Collection doesn't exist**: Check Firestore data in console
4. **Browser cache**: Try hard refresh or incognito mode
5. **Firebase project mismatch**: Verify correct project is selected

## 📞 Next Steps

1. **Deploy the rules** using the script
2. **Test the admin interface** 
3. **Check browser console** for detailed error messages
4. **Report back** with any new error details or success

The temporary rules should resolve the permissions issue immediately after deployment.
