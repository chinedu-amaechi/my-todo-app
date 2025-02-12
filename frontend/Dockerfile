# todo-frontend/Dockerfile

# Stage 1: Build the app
FROM node:16-alpine AS builder
WORKDIR /app

# Copy dependency definitions and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code and build the app
COPY . .
RUN npm run build

# Stage 2: Run the app in production mode
FROM node:16-alpine
WORKDIR /app

# Copy the build output and node_modules from the builder stage
COPY --from=builder /app ./

# Expose port 3000 (the default Next.js port)
EXPOSE 3000

# Start the Next.js server
CMD ["npm", "run", "start"]
