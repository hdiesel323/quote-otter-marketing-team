# QuoteOtter AI Agent System - Docker Image
# Multi-stage build for production deployment on Coolify

# Stage 1: Base image with Node.js
FROM node:20-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    git

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 3: Runner - Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 agentuser

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy dependencies from deps stage
COPY --from=deps --chown=agentuser:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=agentuser:nodejs . .

# Create directories for runtime data
RUN mkdir -p /app/data /app/logs && \
    chown -R agentuser:nodejs /app/data /app/logs

# Switch to non-root user
USER agentuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]
