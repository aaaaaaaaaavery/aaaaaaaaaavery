#!/bin/bash

# Deployment script for flashlive-scraper with optimized polling
# This deploys the updated index.js with ESPN polling optimization

echo "🚀 Deploying flashlive-scraper with optimized polling..."
echo ""

# Check if we're in the right directory
if [ ! -f "index.js" ]; then
    echo "❌ Error: index.js not found in current directory"
    echo "   Please run this script from the project root"
    exit 1
fi

# Verify syntax
echo "📝 Checking syntax..."
node -c index.js
if [ $? -ne 0 ]; then
    echo "❌ Syntax check failed! Please fix errors before deploying."
    exit 1
fi
echo "✅ Syntax check passed"
echo ""

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy flashlive-scraper \
  --source=. \
  --allow-unauthenticated \
  --region=us-central1 \
  --project=flashlive-daily-scraper \
  --set-env-vars=SPREADSHEET_ID=1vSHd7VQzFjTeZhIbWGJHsU_Mbz5OOYvkPHyVU0auzWw,\
SHEET_NAME=Sheet1,\
FIREBASE_PROJECT_ID=flashlive-daily-scraper,\
RAPIDAPI_KEY=1c6421f9acmshe820d0c9faf1cf5p165f88jsnc42711af762d,\
RAPIDAPI_HOST=flashlive-sports.p.rapidapi.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Wait 2-3 minutes for the next polling run"
    echo "2. Check logs for optimization messages:"
    echo "   gcloud logging read \\"
    echo "     \"resource.type=cloud_run_revision AND \\"
    echo "      resource.labels.service_name=flashlive-scraper AND \\"
    echo "      textPayload=~\\\"optimized polling\\\"\" \\"
    echo "     --limit 10 --format json --project=flashlive-daily-scraper"
    echo ""
    echo "3. Or run the verification script:"
    echo "   node verify-optimization.js"
    echo ""
    echo "4. Monitor for these log messages:"
    echo "   ✅ \"Using optimized polling: fetching X individual games\""
    echo "   ✅ \"Optimized polling complete: fetched X games\""
    echo "   ✅ \"found X games to poll individually\""
else
    echo "❌ Deployment failed!"
    exit 1
fi
