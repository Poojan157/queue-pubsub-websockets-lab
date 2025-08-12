# Use a small Node base image
FROM node:18-alpine

# Create app dir
WORKDIR /usr/src/app

# Copy package manifests first (better layer caching)
COPY package*.json ./

# Install deps (use npm ci if you have package-lock.json in CI)
RUN npm install --production

# Copy app source
COPY . .

# Default command is the main server; docker-compose will override for worker
CMD ["node", "index.js"]
