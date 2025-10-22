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

- **Backend**: NestJS 11, TypeORM, Microsoft SQL Server (MSSQL), JWT authentication
- **Frontend**: React 19, Vite, TanStack Router/Query/Form, Tailwind CSS, Shadcn UI
- **Observability**: Prometheus metrics, Grafana dashboards, structured logging
- **Deployment**: Docker, Docker Compose, Nginx
- **Testing**: Jest (API), Vitest + Testing Library (Web)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Architecture

- **Monorepo**: PNPM workspaces with Turborepo
- **API**: NestJS with modular architecture, TypeORM entities, JWT guards
- **Web**: React with feature-first structure, file-based routing, optimistic updates
- **Database**: Microsoft SQL Server (MSSQL) with migrations and seed data
- **Monitoring**: HTTP metrics, request correlation, centralized logging

## Documentation

- [Observability Runbook](docs/OBSERVABILITY_RUNBOOK.md)
- [Docker Deployment](README-Docker.md)
- [API Documentation](apps/api/README.md)
- [Web App Documentation](apps/web/README.md)

## License

MIT
