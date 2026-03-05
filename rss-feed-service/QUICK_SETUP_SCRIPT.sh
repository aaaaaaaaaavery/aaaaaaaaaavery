#!/bin/bash

# Quick Setup Script for RSS Feed Service
# Run this on your other computer (MacBook Pro 2015)

echo "🚀 RSS Feed Service Setup Script"
echo "=================================="
echo ""

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_DIR="$SCRIPT_DIR"
USERNAME=$(whoami)

echo "📁 Service directory: $SERVICE_DIR"
echo "👤 Username: $USERNAME"
echo ""

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "   Please install Node.js from https://nodejs.org/"
    echo "   Or run: brew install node"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js found: $NODE_VERSION"
echo ""

# Check npm
echo "🔍 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found!"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm found: $NPM_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd "$SERVICE_DIR"
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Test service
echo "🧪 Testing service..."
node index.js &
SERVICE_PID=$!
sleep 3

if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Service is working!"
    kill $SERVICE_PID
else
    echo "❌ Service test failed"
    kill $SERVICE_PID 2>/dev/null
    exit 1
fi

echo ""

# Create launchd plist
echo "📝 Creating launchd service file..."
PLIST_FILE="$HOME/Library/LaunchAgents/com.rssfeed.service.plist"

# Find node path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    NODE_PATH="/usr/local/bin/node"
fi

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rssfeed.service</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$SERVICE_DIR/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SERVICE_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$SERVICE_DIR/service.log</string>
    <key>StandardErrorPath</key>
    <string>$SERVICE_DIR/service-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

echo "✅ Created: $PLIST_FILE"
echo ""

# Load service
echo "🔄 Loading launchd service..."
launchctl load "$PLIST_FILE" 2>/dev/null || launchctl load -w "$PLIST_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Service loaded"
else
    echo "⚠️  Service may already be loaded, continuing..."
fi

# Start service
echo "▶️  Starting service..."
launchctl start com.rssfeed.service
sleep 2

# Verify
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Service is running!"
    echo ""
    echo "🌐 Service URL: http://localhost:8080"
    echo "📊 Health check: http://localhost:8080/health"
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Set up Cloudflare Tunnel: cloudflared tunnel --url http://localhost:8080"
    echo "   2. Update index.html with the tunnel URL"
    echo "   3. Set up cron job for refresh script (see SETUP_ON_OTHER_COMPUTER.md)"
    echo "   4. Configure power settings (System Preferences → Energy Saver)"
    echo ""
else
    echo "⚠️  Service may need a moment to start"
    echo "   Check logs: tail -f $SERVICE_DIR/service-error.log"
    echo ""
fi

echo "📚 For more details, see: SETUP_ON_OTHER_COMPUTER.md"
echo ""

