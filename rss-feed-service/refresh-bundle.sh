#!/bin/bash

# Local cache refresh script for ALL custom RSS feeds
# This script refreshes all individual feeds and bundles

SERVICE_URL="https://rss-feed-service-124291936014.us-central1.run.app"

# List of bundles to refresh (from bundle-rss.js BUNDLE_CONFIGS)
BUNDLES=(
  "ncaaw-videos"
  "ncaam-videos"
  "home-videos"
  "tennis-videos"
  "soccer-videos"
  "ncaaf-highlights"
  "ncaaf-videos"
  "boxing-videos"
)

# List of individual feeds to refresh (update this if you add new feeds)
FEEDS=(
  "mlb-com" "espn-mlb" "cbs-mlb" "yahoo-mlb" "fox-mlb"
  "nba-com" "espn-nba" "cbs-nba" "yahoo-nba"
  "nfl-com" "espn-nfl" "cbs-nfl" "yahoo-nfl"
  "nhl-com" "espn-nhl" "cbs-nhl" "yahoo-nhl"
)

echo ""
echo "🔄 Starting refresh of ALL custom RSS feeds at $(date)"
echo ""

# Try to fetch feed list from service (optional - falls back to hardcoded list)
echo "📡 Fetching list of available feeds..."
FEED_LIST=$(curl -s "${SERVICE_URL}/feeds" 2>/dev/null | grep -o '"id":"[^"]*"' | sed 's/"id":"//g' | sed 's/"//g' | tr '\n' ' ')

if [ -n "$FEED_LIST" ]; then
  # Use fetched list
  FEEDS_ARRAY=($FEED_LIST)
  echo "   Found ${#FEEDS_ARRAY[@]} individual feed(s) from service"
else
  # Use hardcoded list
  FEEDS_ARRAY=("${FEEDS[@]}")
  echo "   Using hardcoded list of ${#FEEDS_ARRAY[@]} feed(s)"
fi
echo ""

SUCCESS=0
FAILED=0

# Refresh all individual feeds
echo "🔄 Refreshing individual feeds..."
for feed in "${FEEDS_ARRAY[@]}"; do
  URL="${SERVICE_URL}/feeds/${feed}.xml"
  
  if curl -s -f -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
    echo "✅ [$(date +%Y-%m-%d\ %H:%M:%S)] Refreshed Feed: ${feed}"
    ((SUCCESS++))
  else
    echo "❌ [$(date +%Y-%m-%d\ %H:%M:%S)] Failed Feed: ${feed}"
    ((FAILED++))
  fi
done

# Refresh all bundles
echo ""
echo "🔄 Refreshing ${#BUNDLES[@]} bundle(s)..."
for bundle in "${BUNDLES[@]}"; do
  URL="${SERVICE_URL}/bundle/${bundle}.xml"
  
  if curl -s -f -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
    echo "✅ [$(date +%Y-%m-%d\ %H:%M:%S)] Refreshed Bundle: ${bundle}"
    ((SUCCESS++))
  else
    echo "❌ [$(date +%Y-%m-%d\ %H:%M:%S)] Failed Bundle: ${bundle}"
    ((FAILED++))
  fi
done

TOTAL=$((SUCCESS + FAILED))

echo ""
echo "📊 Summary:"
echo "   Total: ${TOTAL} feed(s) and bundle(s)"
echo "   ✅ Succeeded: ${SUCCESS}"
echo "   ❌ Failed: ${FAILED}"
echo ""

# Exit with error code if any failed
exit $FAILED

