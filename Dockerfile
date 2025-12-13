FROM node:18-bullseye-slim

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install dependencies (including server deps which we merged)
RUN npm install

# Copy all source code
COPY . .

# Expose Hugging Face default port
EXPOSE 7860

# Start the server
CMD ["node", "server/index.js"]
