#!/bin/bash

echo "🚀 Deploying Firebase Security Rules..."
echo "This will fix the 'Missing or insufficient permissions' error"
echo ""

# Deploy Firestore rules
echo "📄 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules  
echo "📁 Deploying Storage rules..."
firebase deploy --only storage

echo ""
echo "✅ Rules deployment complete!"
echo ""
echo "🧪 Test the following after deployment:"
echo "- Admin can access submission review pages"
echo "- No more 'Missing or insufficient permissions' errors"
echo "- Public users still cannot access pending content"
echo ""
echo "⚠️  IMPORTANT: The submission rules are temporarily open to all authenticated users"
echo "   Once the issue is confirmed fixed, we'll restrict them back to team members only"
