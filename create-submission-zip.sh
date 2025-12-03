#!/bin/bash

# Script to create a clean source code ZIP for submission
# This excludes node_modules, dist, and other unnecessary files

echo "📦 Creating source code ZIP for submission..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Create ZIP file
zip -r pacematch-source-code.zip . \
  -x "node_modules/*" \
  -x "dist/*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".DS_Store" \
  -x ".env*" \
  -x "*.local" \
  -x "bun.lockb" \
  -x "*.suo" \
  -x "*.ntvs*" \
  -x "*.njsproj" \
  -x "*.sln" \
  -x "*.sw?" \
  -x ".vscode/*" \
  -x ".idea/*" \
  -x "ios/Pods/*" \
  -x "android/.gradle/*" \
  -x "android/app/build/*" \
  -x "android/build/*" \
  -x "android/.idea/*"

# Check if ZIP was created successfully
if [ -f "pacematch-source-code.zip" ]; then
    # Get file size
    SIZE=$(du -h pacematch-source-code.zip | cut -f1)
    echo "✅ Success! ZIP file created: pacematch-source-code.zip"
    echo "📊 File size: $SIZE"
    echo ""
    echo "📋 Contents included:"
    echo "   ✅ All source code (.tsx, .ts, .js files)"
    echo "   ✅ Configuration files"
    echo "   ✅ Documentation"
    echo "   ✅ Android and iOS native code"
    echo ""
    echo "📋 Contents excluded:"
    echo "   ❌ node_modules/"
    echo "   ❌ dist/ (build output)"
    echo "   ❌ .git/ (version control)"
    echo "   ❌ .env files (secrets)"
    echo ""
    echo "🎯 Ready to submit to your professor!"
else
    echo "❌ Error: Failed to create ZIP file"
    exit 1
fi

