## Context

The project is a monorepo with NestJS API and React web app. Currently requires manual setup with Node.js, PNPM, and database configuration. Need containerization for consistent deployment and development environments.

## Goals / Non-Goals

- Goals:
  - Consistent development environment across machines
  - Production-ready container deployment
  - Support for Linux AMD64 target architecture
  - Hot reload in development containers
  - Database persistence and migration support
- Non-Goals:
  - Kubernetes configurations (beyond scope)
  - Multi-architecture support (only Linux AMD64)
  - Advanced monitoring/logging setups
  - CI/CD pipeline integration

## Decisions

- Decision: Multi-stage Dockerfiles for optimized production images
  - Rationale: Smaller final images, separate build dependencies
  - Alternatives considered: Single-stage, but larger image sizes

- Decision: PostgreSQL as default database for all environments
  - Rationale: Single database engine simplifies parity between development and production
  - Alternatives considered: SQLite in development for simplicity, but diverging engines increase risk

- Decision: Docker Compose for orchestration
  - Rationale: Simple, widely adopted, good for local dev
  - Alternatives considered: Kubernetes, but overkill for this project

- Decision: Linux AMD64 target only
  - Rationale: Simplifies build process, covers most deployment scenarios
  - Alternatives considered: Multi-arch, but adds complexity

## Risks / Trade-offs

- Database migration complexity → Use TypeORM migrations, provide scripts
- Image size vs. dependencies → Multi-stage builds minimize final size
- Development experience → Use volume mounts for hot reload
- Environment configuration → Centralized .env templates

## Migration Plan

1. Add Docker files without breaking existing setup
2. Provide parallel deployment methods (Docker vs traditional)
3. Gradually transition to Docker-first documentation
4. Eventually deprecate non-Docker setup (future consideration)

## Open Questions

- Should we include reverse proxy (nginx) in production compose?
- Database backup strategy for containers?
- Health check endpoints needed?
- Log aggregation approach?
