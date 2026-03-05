#!/bin/bash

# Simple script to start Cloudflare Tunnel with free URL (no DNS setup)

echo "🚀 Starting Cloudflare Tunnel (Free URL - No DNS Changes)"
echo ""
echo "This will give you a free URL like: https://rss-feed-service-abc123.trycloudflare.com"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
  echo "❌ cloudflared not found. Installing..."
  if command -v brew &> /dev/null; then
    brew install cloudflare/cloudflare/cloudflared
  else
    echo "Please install Homebrew first, or download from:"
    echo "https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
  fi
fi

# Check if tunnel exists
if ! cloudflared tunnel list | grep -q "rss-feed-service"; then
  echo "Creating tunnel..."
  cloudflared tunnel create rss-feed-service
  echo ""
fi

echo "Starting tunnel..."
echo "Your URL will appear below. Copy it!"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cloudflared tunnel run rss-feed-service

