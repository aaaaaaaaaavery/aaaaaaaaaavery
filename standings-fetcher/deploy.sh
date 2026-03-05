#!/bin/bash

# Deployment script for standings-fetcher service

echo "🚀 Deploying Standings Fetcher to Cloud Run..."

# Check if SPORTSDATA_API_KEY is provided
if [ -z "$1" ]; then
    echo "❌ Error: SportsData.io API key required"
    echo "Usage: ./deploy.sh YOUR_SPORTSDATA_API_KEY"
    exit 1
fi

SPORTSDATA_API_KEY=$1

# Deploy to Cloud Run
gcloud run deploy standings-fetcher \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=flashlive-daily-scraper,SPORTSDATA_API_KEY=$SPORTSDATA_API_KEY \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up Cloud Scheduler to run daily:"
    echo "   gcloud scheduler jobs create http update-standings-daily \\"
    echo "     --schedule=\"0 6 * * *\" \\"
    echo "     --time-zone=\"America/New_York\" \\"
    echo "     --uri=\"https://standings-fetcher-124291936014.us-central1.run.app/updateStandings\" \\"
    echo "     --http-method=POST \\"
    echo "     --location=us-central1"
    echo ""
    echo "2. Test the service:"
    echo "   curl -X POST https://standings-fetcher-124291936014.us-central1.run.app/updateStandings"
else
    echo "❌ Deployment failed!"
    exit 1
fi

