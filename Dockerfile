# Multi-stage build for production optimization

# Stage 1: Base
FROM node:18-alpine AS base
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Stage 2: Development
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose ports
EXPOSE 5000

# Use dumb-init to handle signals properly
CMD ["dumb-init", "npm", "run", "dev"]

# Stage 3: Production dependencies
FROM base AS production-deps
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 4: Production
FROM node:18-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy production dependencies from production-deps stage
COPY --from=production-deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "src/server.js"]
