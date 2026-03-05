#!/bin/bash

# Start Cloudflare Tunnel for rss.thporth.com

echo "🚀 Starting Cloudflare Tunnel..."
echo "Tunnel URL: https://rss.thporth.com"
echo "Press Ctrl+C to stop"
echo ""

cloudflared tunnel run rss-feed-service

