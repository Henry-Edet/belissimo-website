# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Expose NestJS default port
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start:dev"]
