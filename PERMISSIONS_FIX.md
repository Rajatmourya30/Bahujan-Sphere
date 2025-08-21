# Firebase Permissions Error Fix

## 🚨 Issue Identified
**Error**: Persistent "Missing or insufficient permissions" (Firestore) and "storage/unauthorized" (Storage) errors, even for authenticated admin users.

## 🔍 Root Cause Analysis

The security rules were flawed in several ways, leading to a cascade of errors:

1.  **Firestore Rules Too Permissive**: Public collections were wide open with `allow read: if true;`, creating a major security hole for pending content.
2.  **Storage Rules Too Restrictive/Complex**: Attempts to link Storage rules to Firestore (`get()` calls) were failing silently, likely due to subtle permission chains. When a rule contains a `get()` or `exists()` call, the user must have permission to perform that *read* in Firestore *in addition to* the Storage permission they are requesting. This created a circular dependency that blocked legitimate users.
3.  **Client-Side Vulnerability**: The app's pages did not check the `status` of a document before rendering it, meaning a user with a direct link could bypass the intended content moderation workflow.

## ✅ Solution Implemented

### 1. Simplified and Secure Storage Rules
The `storage/unauthorized` error was fixed by removing the complex Firestore checks from the storage rules and relying on a simple, robust pattern.

```javascript
// OLD (Problematic)
// This failed because the user needs read permission on teamMembers 
// in Firestore just to get permission to write to Storage.
allow write: if get(/databases/(default)/documents/teamMembers/$(request.auth.uid)).data.role in ['Admin'];

// NEW (Fixed and Secure)
function isTeamMember() {
  // exists() is more efficient and requires less permission than get()
  return exists(/databases/(default)/documents/teamMembers/$(request.auth.uid));
}
match /{...} {
  // This rule is now simple: if the user is a team member, they can write.
  allow write: if isTeamMember();
}
```

### 2. Hardened Firestore Rules
The Firestore data leak was patched by adding a crucial check on the `status` field for all public content.

```javascript
// OLD (Vulnerable)
match /readingRoomPdfs/{docId} {
  allow read: if true; // Leaks pending documents!
}

// NEW (Secure)
function isApprovedContent(resource) {
  return resource.data.status == 'approved';
}
match /readingRoomPdfs/{docId} {
  // Public can only read approved content
  allow read: if isApprovedContent(resource);
  // Team members can read everything for review purposes
  allow read: if isTeamMember();
}
```

### 3. Added Client-Side Verification
A final security layer was added to the component that displays content, ensuring it respects the `status` field.

```typescript
// In PdfViewPage.tsx
const isTeamMember = // ... check user's role
if (pdfData.status !== 'approved' && !isTeamMember) {
  setError('This document is not available for public viewing.');
  return;
}
```

## 🎯 Benefits of This Approach

1.  **Resolves Permission Errors**: The simplified storage rules immediately fix the `storage/unauthorized` error for authenticated team members.
2.  **Patches Security Holes**: Prevents public access to pending or rejected content in both Firestore and Storage.
3.  **Defense in Depth**: Combines backend security rules with frontend verification for a robust security posture.
4.  **Clarity and Maintainability**: The new rules are simpler and easier to understand, reducing the chance of future errors.

## 🚀 Deployment Status

The fixed rules have been implemented in `firestore.rules` and `storage.rules`. Deploy them using the new script:

```bash
./deploy-rules.sh
```
