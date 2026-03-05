#!/bin/bash

# Script to update all RSS feed service URLs in index (1).html

if [ -z "$1" ]; then
  echo "Usage: ./update-rss-urls.sh https://YOUR_NGROK_URL.ngrok-free.app"
  echo ""
  echo "Example:"
  echo "  ./update-rss-urls.sh https://abc123xyz.ngrok-free.app"
  exit 1
fi

NEW_URL="$1"
OLD_URL="https://rss-feed-service-124291936014.us-central1.run.app"
HTML_FILE="index (1).html"

if [ ! -f "$HTML_FILE" ]; then
  echo "Error: $HTML_FILE not found in current directory"
  exit 1
fi

echo "Updating RSS feed URLs..."
echo "  Old: $OLD_URL"
echo "  New: $NEW_URL"
echo ""

# Count occurrences
COUNT=$(grep -o "$OLD_URL" "$HTML_FILE" | wc -l | tr -d ' ')
echo "Found $COUNT occurrences to replace"

# Create backup
cp "$HTML_FILE" "${HTML_FILE}.backup"
echo "Backup created: ${HTML_FILE}.backup"

# Replace URLs
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|$OLD_URL|$NEW_URL|g" "$HTML_FILE"
else
  # Linux
  sed -i "s|$OLD_URL|$NEW_URL|g" "$HTML_FILE"
fi

# Verify
NEW_COUNT=$(grep -o "$NEW_URL" "$HTML_FILE" | wc -l | tr -d ' ')
echo ""
echo "✅ Update complete!"
echo "  Replaced: $COUNT occurrences"
echo "  New URL found: $NEW_COUNT times"
echo ""
echo "Next steps:"
echo "  1. Review the changes in $HTML_FILE"
echo "  2. Upload to your thporth.com server"
echo "  3. Test the feeds on your site"

