#!/bin/bash
# Script to install Chromium for Puppeteer
# This works around the cosmiconfig issue with the home directory package.json

cd "$(dirname "$0")"

echo "Installing Chromium for Puppeteer..."
echo "This may take a few minutes..."

# Set HOME to current directory to avoid cosmiconfig issues
HOME="$(pwd)" npx puppeteer browsers install chrome

echo ""
echo "Chromium installation complete!"
echo "You can now start the service with: ./start-service.sh"

