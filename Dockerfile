# =============================================================================
# EPI-Q - Production Docker Image
# Multi-stage build optimized for Next.js standalone output
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

# Increase Node.js memory limit for large builds (Railway has limited memory)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Provide dummy environment variables for build phase (Next.js needs them for static analysis)
# The real values will be injected at runtime by Railway
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV SESSION_SECRET="build-time-dummy-secret-replaced-at-runtime"
ENV AUTH_SECRET="build-time-dummy-secret-replaced-at-runtime"
ENV JWT_SECRET="build-time-dummy-secret-replaced-at-runtime"
ENV MASTER_ENCRYPTION_KEY="0000000000000000000000000000000000000000000000000000000000000000"

# Build the Next.js application (produces standalone output)
RUN pnpm run build

# -----------------------------------------------------------------------------
# Stage 4: Production Runner (Final Image - Standalone)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"
# Clear the large memory setting from build stage (not needed at runtime)
ENV NODE_OPTIONS=""

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files (required for standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy additional server-side files needed at runtime
COPY --from=builder --chown=nextjs:nodejs /app/shared ./shared
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/server ./server
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts

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

# Start the Next.js standalone server
CMD ["node", "server.js"]
