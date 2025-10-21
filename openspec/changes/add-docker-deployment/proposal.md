## Why

The project needs containerized deployment support for consistent environments across development, testing, and production. Docker will simplify setup, ensure reproducibility, and enable deployment to container orchestration platforms.

## What Changes

- Add Dockerfile for API (NestJS) with multi-stage build for Linux AMD64
- Add Dockerfile for Web (React/Vite) with multi-stage build for Linux AMD64  
- Add docker-compose.yml for local development with both services and database
- Add docker-compose.prod.yml for production deployment
- Add .dockerignore files for optimized builds
- Add build scripts for cross-compilation to Linux AMD64
- **BREAKING**: Change database default from SQLite to PostgreSQL in production

## Impact

- Affected specs: deployment, development-setup
- Affected code: Root directory configuration, both apps' build processes
- New capabilities: Container-based deployment, environment consistency