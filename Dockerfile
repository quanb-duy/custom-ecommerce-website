FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Set the PORT environment variable
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start the server
CMD ["node", "server.js"] 