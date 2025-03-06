# Use the official Node.js 18 image as a base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app will run on
EXPOSE 8080

# Start the application
CMD ["node", "start.js"] 