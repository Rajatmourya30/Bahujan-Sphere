#!/bin/bash

# Deploy Upload Fix Script
# Run this after completing Firebase authentication

echo "🚀 Deploying Upload Issue Fix..."
echo "================================"

# Check if Firebase CLI is authenticated
if ! firebase projects:list > /dev/null 2>&1; then
    echo "❌ Error: Firebase CLI not authenticated"
    echo "Please run: firebase login --no-localhost"
    echo "And complete the authentication process first"
    exit 1
fi

echo "✅ Firebase CLI authenticated"

# Deploy Firestore and Storage rules
echo "📋 Deploying Firestore and Storage rules..."
firebase deploy --only firestore:rules,storage

if [ $? -eq 0 ]; then
    echo "✅ Security rules deployed successfully!"
    echo ""
    echo "🔧 Upload Issue Fix Summary:"
    echo "- Fixed storage rules to support team member verification"
    echo "- Updated Firestore rules for proper document access"
    echo "- Enhanced upload form with robust team member checking"
    echo "- Added fallback verification for legacy team members"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Test upload functionality with different user roles"
    echo "2. Verify team members can upload PDFs and images"
    echo "3. Check console logs for any remaining issues"
    echo "4. Review UPLOAD_ISSUE_DIAGNOSIS.md for detailed information"
    echo ""
    echo "🎉 Upload functionality should now be working!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
