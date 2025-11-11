# =============================================================================
# EPI X-Ray - Production Docker Image
# Multi-stage build with security hardening for portable deployment
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Install security updates and required system dependencies
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    dumb-init && \
    rm -rf /var/cache/apk/*

# -----------------------------------------------------------------------------
# Stage 2: Dependencies Installation
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile --prod=false

# -----------------------------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Set Next.js to production mode
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
# This creates the .next folder with optimized production build
RUN pnpm run build

# -----------------------------------------------------------------------------
# Stage 4: Production Runner (Final Image)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling and enable pnpm
RUN apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/* && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy necessary configuration files
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/shared ./shared
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/server ./server

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 5000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js production server
CMD ["pnpm", "start"]
