FROM node:18-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Set the PORT environment variable - match Railway's setting
ENV PORT=8080
ENV NODE_ENV=production
ENV RAILWAY_ENVIRONMENT=true

# Expose port
EXPOSE 8080

# Use a health check to help Railway verify the application is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the server
CMD ["node", "server.js"] 