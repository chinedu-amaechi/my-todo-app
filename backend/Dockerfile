# todo-backend/Dockerfile
FROM node:16-alpine

# Create and set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your source code
COPY . .

# Expose the backend port (make sure this matches your Express app’s port)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
