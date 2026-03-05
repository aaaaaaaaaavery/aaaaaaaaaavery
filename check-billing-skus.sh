#!/bin/bash
# Script to check detailed billing SKUs for App Engine costs
# This helps identify what's actually being charged under "App Engine" in billing

PROJECT_ID="flashlive-daily-scraper"
BILLING_ACCOUNT="01D3B4-343BA5-7B8388"

echo "🔍 Checking billing SKUs for App Engine-related costs..."
echo "Project: $PROJECT_ID"
echo "Billing Account: $BILLING_ACCOUNT"
echo ""
echo "NOTE: Detailed billing data requires BigQuery export or Console access."
echo ""
echo "Checking recent Cloud Build costs..."
gcloud builds list --project=$PROJECT_ID --limit=20 --format="table(id,status,createTime,duration)" 2>&1

echo ""
echo "Checking Artifact Registry repositories and sizes..."
gcloud artifacts repositories list --project=$PROJECT_ID --format="table(name,location,format)" 2>&1

echo ""
echo "Checking Artifact Registry storage..."
for repo in gcr.io cloud-run-source-deploy gcf-artifacts jobs; do
  echo ""
  echo "Repository: $repo"
  gcloud artifacts repositories describe $repo --project=$PROJECT_ID --location=us --format="get(name,Repository Size)" 2>&1 || \
  gcloud artifacts repositories describe $repo --project=$PROJECT_ID --location=us-central1 --format="get(name)" 2>&1
done

echo ""
echo "✅ To view detailed billing SKUs:"
echo "   1. Go to: https://console.cloud.google.com/billing/$BILLING_ACCOUNT/reports"
echo "   2. Click 'Group by: SKU'"
echo "   3. Filter for 'App Engine' or 'Artifact Registry'"
echo "   4. Check the last 30 days for detailed breakdown"
echo ""
echo "📊 Expected costs:"
echo "   - Artifact Registry storage (~1.7GB): ~\$0.12/month"
echo "   - Cloud Build: Free tier covers 120 build-minutes/day"
echo "   - Actual 'App Engine' costs likely from Artifact Registry operations"
