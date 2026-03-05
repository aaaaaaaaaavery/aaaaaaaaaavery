#!/bin/bash

# Test script to run after deployment
# This manually triggers the polling endpoint to test optimization

SERVICE_URL="https://flashlive-scraper-124291936014.us-central1.run.app"

echo "🧪 Testing ESPN Polling Optimization After Deployment"
echo "=" | head -c 70 && echo ""
echo ""

echo "📡 Triggering /pollESPNLiveData endpoint..."
echo ""

# Trigger the endpoint
START_TIME=$(date +%s)
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${SERVICE_URL}/pollESPNLiveData" \
  -H "Accept: application/json" \
  -H "User-Agent: Test-Script/1.0")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Response Code: $HTTP_CODE"
echo "Duration: ${DURATION}s"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Error: HTTP $HTTP_CODE"
    echo "$BODY" | head -20
    exit 1
fi

# Parse JSON response
GAMES_FETCHED=$(echo "$BODY" | jq -r '.gamesFetched // 0' 2>/dev/null || echo "0")
GAMES_WRITTEN=$(echo "$BODY" | jq -r '.gamesWritten // 0' 2>/dev/null || echo "0")
MESSAGE=$(echo "$BODY" | jq -r '.message // "N/A"' 2>/dev/null || echo "N/A")

echo "📊 Response Analysis:"
echo "   Games Fetched: $GAMES_FETCHED"
echo "   Games Written: $GAMES_WRITTEN"
echo "   Message: $MESSAGE"
echo ""

# Check for optimization indicators
MESSAGE_LOWER=$(echo "$MESSAGE" | tr '[:upper:]' '[:lower:]')

if echo "$MESSAGE_LOWER" | grep -q "optimized polling\|individual games"; then
    echo "✅ OPTIMIZATION IS ACTIVE!"
    echo "   Using individual game polling"
    echo "   Estimated API calls: ~$GAMES_FETCHED (vs. ~70 before)"
    if [ "$GAMES_FETCHED" -gt 0 ] && [ "$GAMES_FETCHED" -lt 20 ]; then
        SAVINGS=$((70 - GAMES_FETCHED))
        echo "   Savings: ~$SAVINGS API calls per poll"
    fi
elif echo "$MESSAGE_LOWER" | grep -q "skipped fetch\|no live games"; then
    echo "✅ OPTIMIZATION IS ACTIVE!"
    echo "   Skipped API calls entirely (no games to poll)"
    echo "   Maximum optimization achieved!"
elif [ "$GAMES_FETCHED" -gt 50 ]; then
    echo "⚠️  OPTIMIZATION NOT YET ACTIVE"
    echo "   Possible reasons:"
    echo "   1. Morning run (first run of day) - uses fallback"
    echo "   2. Code not deployed yet"
    echo "   3. No games match polling criteria"
    echo ""
    echo "   💡 Check Cloud Run logs for details"
else
    echo "✅ OPTIMIZATION LIKELY ACTIVE"
    echo "   Fetching $GAMES_FETCHED games (likely individual polling)"
    echo "   Check Cloud Run logs to confirm"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Check Cloud Run logs:"
echo "   gcloud logging read \\"
echo "     \"resource.type=cloud_run_revision AND \\"
echo "      resource.labels.service_name=flashlive-scraper AND \\"
echo "      textPayload=~\\\"optimized polling\\\"\" \\"
echo "     --limit 10 --format json --project=flashlive-daily-scraper"
echo ""
echo "2. If optimization is working, you can turn Cloud Scheduler back on"
echo "3. Monitor for 24 hours to ensure everything works correctly"
