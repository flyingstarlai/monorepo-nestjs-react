# Multi-stage build for NestJS API
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/biome-config/package.json ./packages/biome-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage with hot reload
FROM base AS development
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy workspace manifest and dependencies from deps stage
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/turbo.json ./turbo.json
COPY --from=deps /app/tsconfig.json ./tsconfig.json
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/node_modules ./node_modules

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=1
ENV WATCHPACK_POLLING=1

# Default command runs NestJS in watch mode
CMD ["pnpm", "--filter", "api", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app

# Install pnpm in builder stage
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy package files and node_modules from deps stage
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code and built files
COPY apps/api ./apps/api
COPY packages ./packages

# Build the API application for production
RUN pnpm --filter api build

# Production stage  
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Copy package files
COPY apps/api/package.json ./package.json
COPY apps/api/pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --prod

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Set ownership
RUN chown -R nestjs:nodejs /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/src/main"]
