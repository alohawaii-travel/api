FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY .env* ./

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Development command (overridden in docker-compose)
CMD ["npm", "run", "dev"]
