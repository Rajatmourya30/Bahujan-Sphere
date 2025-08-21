#!/bin/bash

echo "🚀 Deploying Firebase Security Rules..."
echo ""

# Deploy Firestore rules
echo "📄 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules  
echo "📁 Deploying Storage rules..."
firebase deploy --only storage

echo ""
echo "✅ Rules deployment complete!"
echo "The permission errors should now be resolved."
echo ""
echo "⚠️  IMPORTANT: Please test the application thoroughly to ensure all features work as expected with the new security model."
