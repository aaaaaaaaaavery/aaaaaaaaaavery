#!/bin/bash

# Script to check Cloud Scheduler job execution status
# Usage: ./check-scheduler-jobs.sh

echo "=========================================="
echo "Cloud Scheduler Job Status Check"
echo "=========================================="
echo ""

echo "📋 Listing all scheduler jobs:"
echo "----------------------------------------"
gcloud scheduler jobs list --location=us-central1 --format="table(name,schedule,state,timeZone,lastAttemptTime)"
echo ""

echo "📊 Checking live-polling job (every 2 minutes):"
echo "----------------------------------------"
gcloud scheduler jobs describe live-polling --location=us-central1 --format="yaml(state,schedule,lastAttemptTime,status)" 2>/dev/null || echo "❌ Job not found"
echo ""

echo "🌅 Checking morning-refresh job (5 AM EST daily):"
echo "----------------------------------------"
gcloud scheduler jobs describe morning-refresh --location=us-central1 --format="yaml(state,schedule,lastAttemptTime,status)" 2>/dev/null || echo "❌ Job not found"
echo ""

echo "📝 Recent function logs (last 20 entries):"
echo "----------------------------------------"
gcloud functions logs read thporth-live-games --region=us-central1 --limit=20 --format="table(time_utc,log)" | grep -E "ESPN live data|Morning Refresh|gamesWritten|gamesFetched|success|failed" || echo "No recent logs found"
echo ""

echo "✅ Check complete!"
echo ""
echo "💡 To manually trigger jobs:"
echo "   Live polling: curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/thporth-live-games/pollESPNLiveData"
echo "   Morning refresh: curl -X POST https://us-central1-flashlive-daily-scraper.cloudfunctions.net/thporth-live-games/morningRefresh"

