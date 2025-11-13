# ============================================================
# Multi-stage Dockerfile for NOC System
# ============================================================

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code and Prisma schema
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client and Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy config files and public assets
COPY config ./config
COPY public ./public

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create directories
RUN mkdir -p logs data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/overview', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Start application with entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
