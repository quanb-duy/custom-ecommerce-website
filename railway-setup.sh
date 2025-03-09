
#!/bin/bash
set -e

echo "Starting Railway setup script..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "package.json not found, using Railway backup..."
  cp .railway.package.json package.json
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

echo "Setup completed successfully!"
