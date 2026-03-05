#!/bin/bash

# Deploy RSS Feed Service to Cloud Run

SERVICE_NAME="rss-feed-service"
REGION="us-central1"
PROJECT_ID=$(gcloud config get-value project)

# Check if YouTube API key is provided
if [ -z "$1" ]; then
    echo "⚠️  Warning: No YouTube API key provided"
    echo "   YouTube feeds will use fallback methods (native RSS/scraping)"
    echo "   Usage: ./deploy.sh YOUR_YOUTUBE_API_KEY"
    echo ""
    read -p "Continue without API key? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Get your API key at: https://console.cloud.google.com/apis/credentials"
        exit 1
    fi
    YOUTUBE_API_KEY=""
    ENV_VARS=""
else
    YOUTUBE_API_KEY=$1
    ENV_VARS="--set-env-vars YOUTUBE_API_KEY=$YOUTUBE_API_KEY"
    echo "✅ YouTube API key provided"
fi

echo "Building and deploying $SERVICE_NAME to Cloud Run..."

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10 \
  --min-instances 0 \
  $ENV_VARS

if [ $? -eq 0 ]; then
  SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
  echo ""
  echo "✅ Deployment successful!"
  echo "Service URL: $SERVICE_URL"
  echo ""
  echo "Test the service:"
  echo "  Health: $SERVICE_URL/health"
  echo "  Feeds: $SERVICE_URL/feeds"
  echo "  Example: $SERVICE_URL/feeds/mlb-com.xml"
else
  echo "❌ Deployment failed"
  exit 1
fi

