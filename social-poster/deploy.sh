#!/bin/bash

echo "🚀 Deploying Social Poster to Cloud Run..."

# Deploy to Cloud Run
gcloud run deploy social-poster \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=flashlive-daily-scraper \
  --set-secrets TWITTER_CLIENT_ID=twitter-client-id:latest,TWITTER_CLIENT_SECRET=twitter-client-secret:latest,TWITTER_ACCESS_TOKEN=twitter-access-token:latest,TWITTER_ACCESS_SECRET=twitter-access-secret:latest,INSTAGRAM_ACCESS_TOKEN=instagram-access-token:latest \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 1

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  echo ""
  echo "📋 Next steps:"
  echo "1. Set up Cloud Scheduler to run daily at 6 AM ET:"
  echo "   gcloud scheduler jobs create http post-daily-social \\"
  echo "     --schedule=\"0 6 * * *\" \\"
  echo "     --time-zone=\"America/New_York\" \\"
  echo "     --uri=\"https://social-poster-124291936014.us-central1.run.app/post-daily\" \\"
  echo "     --http-method=POST \\"
  echo "     --location=us-central1 \\"
  echo "     --headers='Content-Type=application/json' \\"
  echo "     --message-body='{\"theme\":\"neon\"}'"
  echo ""
  echo "2. Test the service:"
  echo "   curl -X POST https://social-poster-124291936014.us-central1.run.app/post-daily \\"
  echo "     -H 'Content-Type: application/json' \\"
  echo "     -d '{\"theme\":\"neon\"}'"
else
  echo "❌ Deployment failed!"
  exit 1
fi

