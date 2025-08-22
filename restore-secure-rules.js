// Script to restore secure Firestore rules after initial admin setup
// Run this after you've successfully logged in and been added to teamMembers

const fs = require('fs');

const secureRules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for secure, reusable logic
    function isSignedIn() {
      return request.auth != null;
    }

    // Checks if the user's UID exists as a document ID in the teamMembers collection.
    // This is more secure and efficient than querying by email.
    function isTeamMember() {
      return isSignedIn() && exists(/databases/$(database)/documents/teamMembers/$(request.auth.uid));
    }

    // Checks if a document has been approved for public viewing.
    function isApprovedContent(resource) {
      return resource.data.status == 'approved';
    }

    // PUBLIC CONTENT: Reading Room PDFs
    match /readingRoomPdfs/{docId} {
      allow read: if isApprovedContent(resource) || isTeamMember();
      allow write: if isTeamMember();
    }

    // PUBLIC CONTENT: Books
    match /books/{docId} {
      allow read: if isApprovedContent(resource) || isTeamMember();
      allow write: if isTeamMember();
    }

    // PUBLIC CONTENT: Stores
    match /stores/{docId} {
      allow read: if isApprovedContent(resource) || isTeamMember();
      allow write: if isTeamMember();
    }

    // PUBLIC CONTENT: Knowledge Hub
    match /knowledgeHub/{docId} {
      allow read: if isApprovedContent(resource) || isTeamMember();
      allow write: if isTeamMember();
    }

    // PUBLIC CONTENT: Calendar Events
    match /calendarEvents/{docId} {
      allow read: if isApprovedContent(resource) || isTeamMember();
      allow write: if isTeamMember();
    }

    // SUBMISSIONS: Event Submissions
    match /eventSubmissions/{submissionId} {
      allow create: if isTeamMember();
      allow read, update, delete: if isTeamMember();
    }

    // SUBMISSIONS: Book Submissions
    match /bookSubmissions/{submissionId} {
      allow create: if isTeamMember();
      allow read, update, delete: if isTeamMember();
    }

    // SUBMISSIONS: Store Submissions
    match /storeSubmissions/{submissionId} {
      allow create: if isTeamMember();
      allow read, update, delete: if isTeamMember();
    }

    // SUBMISSIONS: Knowledge Hub Submissions
    match /knowledgeHubSubmissions/{submissionId} {
      allow create: if isTeamMember();
      allow read, update, delete: if isTeamMember();
    }

    // SUBMISSIONS: Reading Room Submissions
    match /readingRoomSubmissions/{submissionId} {
      allow create: if isTeamMember();
      allow read, update, delete: if isTeamMember();
    }
    
    // USER PROFILES: Public user data.
    match /users/{userId} {
      // CREATE: Any signed-in user can create their own profile document.
      allow create: if isSignedIn() && request.auth.uid == userId;

      // READ: Anyone can read user profiles (public profiles).
      allow read: if true;

      // UPDATE: Users can only update their own profile.
      allow update: if isSignedIn() && request.auth.uid == userId;

      // DELETE: Users can delete their own profile.
      allow delete: if isSignedIn() && request.auth.uid == userId;
    }

    // TEAM MEMBERS: Defines roles and permissions for the admin panel.
    match /teamMembers/{memberId} {
      // GET: Allow a logged-in user to check their own team member status.
      // This is crucial for the admin login page to verify permissions.
      allow get: if isSignedIn();

      // LIST: Only existing team members can list all other members.
      allow list: if isTeamMember();

      // WRITE: Only team members can add/update/remove other members.
      // (Further restricted in the app to Admins/Managers).
      allow write: if isTeamMember();
    }
  }
}`;

try {
  fs.writeFileSync('firestore.rules', secureRules);
  console.log('✅ Secure Firestore rules have been restored to firestore.rules');
  console.log('📝 Run "firebase deploy --only firestore:rules" to deploy the secure rules');
} catch (error) {
  console.error('❌ Error writing secure rules:', error);
}
