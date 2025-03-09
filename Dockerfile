FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# Expose the port the server listens on
EXPOSE 8000

# Set the command to run the server
CMD ["npm", "start"] 