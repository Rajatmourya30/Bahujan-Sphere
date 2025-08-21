# Debug Firebase Permissions Issue

## 🚨 Current Status
**Error**: "Error fetching submissions: FirebaseError: Missing or insufficient permissions" or "Firebase Storage: User does not have permission..."
**Component**: Any component interacting with Firestore or Storage.
**Query/Action**: Any read/write operation that is failing.

## 🔍 Debugging Steps

### Step 1: Deploy the Rules
**CRITICAL**: The rules must be deployed to take effect! Use the provided script for convenience.

```bash
# Make the script executable (only need to do this once)
chmod +x deploy-rules.sh

# Run the deployment
./deploy-rules.sh

# OR manually deploy both
firebase deploy --only firestore:rules,storage
```

### Step 2: Verify User Authentication in the App
Check if the user is properly authenticated in the browser console.

```javascript
// Add this to a component's useEffect for debugging
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ Current user is authenticated:", user.email, user.uid);
    } else {
      console.log("❌ User is not authenticated.");
    }
  });
  return () => unsubscribe();
}, []);
```

### Step 3: Check Team Member Document in Firestore
Verify the currently authenticated user has a corresponding document in the `teamMembers` collection in your Firestore database.

1. Go to the **Firebase Console**.
2. Navigate to **Firestore Database**.
3. Go to the **`teamMembers`** collection.
4. **Check for a document where the Document ID is the UID of your logged-in user.**
5. Verify that this document has a `role` field (e.g., `role: "Admin"`).

If this document is missing, the security rules will correctly deny access.

### Step 4: Use the Firebase Rules Playground
The Rules Playground is the most powerful tool for debugging.

1. Go to **Firebase Console → Firestore Database → Rules**.
2. Click on the **"Rules Playground"** tab.
3. **Simulation type**: Choose `get`, `list`, `create`, etc.
4. **Location**: Enter the path to the document you're trying to access (e.g., `/readingRoomSubmissions/some-doc-id`).
5. **Authenticated**: Toggle this ON.
6. **Provider**: `Anonymous` or `Google`, etc.
7. **Firebase UID**: Paste the UID of the user you are testing with.
8. Click **Run**. The playground will show you which lines of your rules passed or failed.

### Step 5: Check CORS Configuration for Storage
If you are still getting Storage errors after deploying the correct rules, the CORS configuration for your Storage bucket may need to be updated.

1. Make sure the `cors.json` file exists in your project root.
2. Run the gsutil command to apply it:
   ```bash
   # You may need to install gsutil first: gcloud components install gsutil
   # Find your bucket URL in Firebase Console -> Storage
   gsutil cors set cors.json gs://<YOUR_BUCKET_URL>
   ```
   Example: `gsutil cors set cors.json gs://my-awesome-project.appspot.com`

## 🚨 If Issue Persists

If the error continues after all these steps, the issue might be:

1. **Rules Not Deployed**: Double-check the Firebase Console to verify the latest rules are active.
2. **User Not Authenticated**: Verify user login status in the app.
3. **Missing `teamMembers` Document**: Ensure the user has a record in the `teamMembers` collection.
4. **Browser Cache**: Try a hard refresh (Ctrl+Shift+R) or an incognito window.
5. **Firebase Project Mismatch**: Verify your local Firebase CLI is configured for the correct project (`firebase use <project_id>`).
