#!/bin/bash

# Deployment script for channel-lookup Cloud Function
# This function matches channel data from Google Sheets to games from ESPN/NCAA APIs

echo "🚀 Deploying Channel Lookup to Cloud Functions (Gen2)..."

# Deploy to Cloud Functions Gen2
gcloud functions deploy channel-lookup \
  --gen2 \
  --region=us-central1 \
  --runtime=nodejs20 \
  --entry-point=channelLookupHandler \
  --trigger-http \
  --allow-unauthenticated \
  --source=. \
  --memory=512Mi \
  --timeout=540s \
  --max-instances=10

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment successful!"
  echo ""
  echo "📋 Function URL:"
  echo "   https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup"
  echo ""
  echo "🧪 Test the function:"
  echo "   curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup"
  echo ""
  echo "📅 To set up Cloud Scheduler (runs daily at 6 AM ET):"
  echo "   gcloud scheduler jobs create http channel-lookup-daily \\"
  echo "     --schedule=\"0 6 * * *\" \\"
  echo "     --time-zone=\"America/New_York\" \\"
  echo "     --uri=\"https://us-central1-flashlive-daily-scraper.cloudfunctions.net/channel-lookup\" \\"
  echo "     --http-method=POST \\"
  echo "     --location=us-central1"
else
  echo "❌ Deployment failed!"
  exit 1
fi
