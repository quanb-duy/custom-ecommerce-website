#!/bin/bash
set -e

# Print debug information
echo "Starting build script..."
echo "Current directory: $(pwd)"
echo "Node.js version (if available): $(node -v 2>/dev/null || echo 'not installed')"
echo "NPM version (if available): $(npm -v 2>/dev/null || echo 'not installed')"

# Install Node.js and NPM if not present
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Installing Node.js and npm..."
    apt-get update -y
    apt-get install -y curl
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    echo "Node version: $(node -v)"
    echo "NPM version: $(npm -v)"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!" 