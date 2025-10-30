# Dashboard Application

A modern dashboard application with user management, authentication, and admin features built with NestJS backend and React frontend.

## Features

- **Authentication**: JWT-based login with role-based access control (Admin/User)
- **User Management**: Admin panel for creating users, managing roles, and enabling/disabling accounts
- **Activities Feed**: Real-time activity tracking and recent events display
- **Observability**: Prometheus metrics, structured logging, and Grafana dashboards
- **Docker Deployment**: Complete containerized deployment with Nginx reverse proxy
- **Modern Tech Stack**: TanStack React Form, TanStack Query, TanStack Router, Tailwind CSS

## Tech Stack

- **Backend**: NestJS 11, TypeORM, PostgreSQL/MSSQL, JWT authentication
- **Frontend**: React 19, Vite, TanStack Router/Query/Form, Tailwind CSS, Shadcn UI
- **Observability**: Prometheus metrics, Grafana dashboards, structured logging
- **Deployment**: Docker, Docker Compose, Nginx
- **Testing**: Jest (API), Vitest + Testing Library (Web)

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file and configure database
cp .env.example .env
# Edit .env to set your database configuration (PostgreSQL recommended)

# Start development environment (includes PostgreSQL)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Database Setup

### PostgreSQL (Recommended)

1. **Using Docker Compose** (Recommended):

   ```bash
   # Start PostgreSQL container
   docker-compose up -d postgres

   # Set environment variables
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres123
   DB_DATABASE=dashboard
   ```

2. **Manual PostgreSQL Setup**:

   ```bash
   # Install PostgreSQL and create database
   createdb dashboard

   # Set environment variables
   DB_TYPE=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_DATABASE=dashboard
   ```

### MSSQL (Legacy Support)

1. **Using Docker Compose**:

   ```bash
   # Start MSSQL container (if you have MSSQL service defined)
   docker-compose up -d mssql

   # Set environment variables
   DB_TYPE=mssql
   DB_HOST=localhost
   DB_PORT=1433
   DB_USERNAME=sa
   DB_PASSWORD=YourStrong!Passw0rd
   DB_DATABASE=dashboard
   ```

### Database Migration

```bash
# Run database migrations
npm run migration:run

# Reset database (clears all data and re-runs migrations)
npm run db:reset
```

## Architecture

- **Monorepo**: PNPM workspaces with Turborepo
- **API**: NestJS with modular architecture, TypeORM entities, JWT guards
- **Web**: React with feature-first structure, file-based routing, optimistic updates
- **Database**: PostgreSQL (primary) with MSSQL legacy support, migrations and seed data
- **Monitoring**: HTTP metrics, request correlation, centralized logging

## Documentation

- [PostgreSQL Setup Guide](docs/POSTGRESQL_SETUP.md)
- [Observability Runbook](docs/OBSERVABILITY_RUNBOOK.md)
- [Docker Deployment](README-Docker.md)
- [API Documentation](apps/api/README.md)
- [Web App Documentation](apps/web/README.md)

## License

MIT
