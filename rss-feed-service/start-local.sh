#!/bin/bash

# Start RSS Feed Service locally with SQLite database (FREE)

echo "🚀 Starting RSS Feed Service locally (FREE - uses SQLite instead of Firestore)"
echo ""

# Set environment variable to use local database
export USE_LOCAL_DB=true

# Start the service
echo "Service will run on: http://localhost:8080"
echo "Background job runs every 15 minutes"
echo ""
echo "Press Ctrl+C to stop"
echo ""

node index.js

