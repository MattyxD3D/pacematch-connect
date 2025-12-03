#!/bin/bash

# Gmail OTP Setup Script for Firebase Cloud Functions
# This script helps you set up Gmail to send OTP codes

echo "🚀 Gmail OTP Setup for Firebase Cloud Functions"
echo "================================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Please run this script from the pacematch-connect directory"
    exit 1
fi

echo "📋 Before continuing, make sure you have:"
echo "   1. Your Gmail address (e.g., yourname@gmail.com)"
echo "   2. Your Gmail App Password (16 characters)"
echo ""
echo "   Get App Password from: https://myaccount.google.com/apppasswords"
echo ""

read -p "Enter your Gmail address: " GMAIL_USER
read -sp "Enter your Gmail App Password (16 chars): " GMAIL_PASSWORD
echo ""

if [ -z "$GMAIL_USER" ] || [ -z "$GMAIL_PASSWORD" ]; then
    echo "❌ Gmail address and App Password are required!"
    exit 1
fi

echo ""
echo "🔧 Setting Firebase config..."
firebase functions:config:set gmail.user="$GMAIL_USER" gmail.app_password="$GMAIL_PASSWORD"

if [ $? -eq 0 ]; then
    echo "✅ Config set successfully!"
    echo ""
    echo "📦 Deploying functions..."
    firebase deploy --only functions
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Functions deployed successfully!"
        echo ""
        echo "⚠️  IMPORTANT: You need to make the function public!"
        echo ""
        echo "Next steps:"
        echo "1. Go to: https://console.firebase.google.com/project/pacematch-gps/functions"
        echo "2. Find 'sendOTPEmail' function"
        echo "3. Click on it → Go to 'Permissions' tab"
        echo "4. Click 'Add Principal'"
        echo "5. Enter: allUsers"
        echo "6. Select role: 'Cloud Functions Invoker'"
        echo "7. Click 'Save'"
        echo ""
        echo "Or use gcloud CLI:"
        echo "gcloud functions add-iam-policy-binding sendOTPEmail \\"
        echo "  --region=us-central1 \\"
        echo "  --member=\"allUsers\" \\"
        echo "  --role=\"roles/cloudfunctions.invoker\" \\"
        echo "  --project=pacematch-gps"
    else
        echo "❌ Deployment failed. Check the error above."
        exit 1
    fi
else
    echo "❌ Failed to set config. Check the error above."
    exit 1
fi

