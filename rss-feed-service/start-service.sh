#!/bin/bash
# Wrapper script to start the RSS service while avoiding cosmiconfig issues
# with the home directory package.json

cd "$(dirname "$0")"

# Set environment to prevent cosmiconfig from searching home directory
export COSMICONFIG_CWD="$(pwd)"
export NODE_PATH="$(pwd)/node_modules"

# Start the service
node index.js

