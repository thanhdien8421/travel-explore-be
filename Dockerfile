# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to use docker cache effectively
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build code TypeScript -> JavaScript (output to /dist)
RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist
# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose the port the app runs on
EXPOSE 8000

# Start the application
# Script "start" should be defined in package.json
CMD ["npm", "run", "start"]