#!/bin/bash

# Pause/Delete Cloud Run service to stop costs
# You can redeploy later using deploy.sh

SERVICE_NAME="rss-feed-service"
REGION="us-central1"

echo "🛑 Pausing Cloud Run service to stop costs..."
echo ""

# Delete the service (this stops all costs immediately)
gcloud run services delete $SERVICE_NAME \
  --region $REGION \
  --quiet

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Cloud Run service deleted successfully!"
  echo "   All costs stopped immediately."
  echo ""
  echo "To redeploy later, run:"
  echo "  ./deploy.sh YOUR_YOUTUBE_API_KEY"
else
  echo ""
  echo "⚠️  Error deleting service. It may already be deleted or you may need to check permissions."
fi

