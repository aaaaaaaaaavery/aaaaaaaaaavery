#!/bin/bash

# Interactive setup script for Cloudflare Tunnel with permanent URL

echo "🚀 Cloudflare Tunnel Setup for rss.thporth.com"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
  echo "❌ cloudflared not found. Installing..."
  if command -v brew &> /dev/null; then
    brew install cloudflare/cloudflare/cloudflared
  else
    echo "Please install Homebrew first, or download cloudflared from:"
    echo "https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
  fi
fi

echo "✅ cloudflared installed"
echo ""

# Step 1: Login
echo "Step 1: Authenticating with Cloudflare..."
echo "This will open your browser to log in."
read -p "Press Enter to continue..."
cloudflared tunnel login

if [ $? -ne 0 ]; then
  echo "❌ Authentication failed. Please try again."
  exit 1
fi

echo "✅ Authenticated"
echo ""

# Step 2: Create tunnel
echo "Step 2: Creating tunnel..."
TUNNEL_NAME="rss-feed-service"
cloudflared tunnel create $TUNNEL_NAME

if [ $? -ne 0 ]; then
  echo "⚠️  Tunnel might already exist. Continuing..."
fi

echo "✅ Tunnel created"
echo ""

# Step 3: Configure DNS
echo "Step 3: Configuring DNS route (rss.thporth.com)..."
echo "This will create a permanent URL: https://rss.thporth.com"
read -p "Press Enter to continue..."
cloudflared tunnel route dns $TUNNEL_NAME rss.thporth.com

if [ $? -ne 0 ]; then
  echo "❌ DNS configuration failed."
  echo "Make sure:"
  echo "  1. thporth.com is using Cloudflare DNS"
  echo "  2. You're logged into the correct Cloudflare account"
  exit 1
fi

echo "✅ DNS configured"
echo ""

# Step 4: Create config file
echo "Step 4: Creating config file..."

CONFIG_DIR="$HOME/.cloudflared"
mkdir -p "$CONFIG_DIR"

# Find credentials file
CREDENTIALS_FILE=$(ls "$CONFIG_DIR"/*.json 2>/dev/null | head -1)

if [ -z "$CREDENTIALS_FILE" ]; then
  echo "⚠️  Could not find credentials file automatically."
  echo "Please find it manually and update the config file."
  CREDENTIALS_FILE="YOUR_CREDENTIALS_FILE.json"
fi

CONFIG_FILE="$CONFIG_DIR/config.yml"
cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_NAME
credentials-file: $CREDENTIALS_FILE

ingress:
  - hostname: rss.thporth.com
    service: http://localhost:8080
  - service: http_status:404
EOF

echo "✅ Config file created: $CONFIG_FILE"
echo ""

# Step 5: Instructions
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Start RSS Feed Service (Terminal 1):"
echo "   cd rss-feed-service"
echo "   ./start-local.sh"
echo ""
echo "2. Start Cloudflare Tunnel (Terminal 2):"
echo "   cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "3. Update frontend URLs:"
echo "   cd /Users/avery/Downloads/Copy\\ of\\ THPORTHINDEX"
echo "   ./update-rss-urls.sh https://rss.thporth.com"
echo ""
echo "Your permanent URL: https://rss.thporth.com"
echo ""

