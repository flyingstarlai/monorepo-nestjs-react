# Dashboard API

A modern NestJS backend providing authentication, user management, activities tracking, and comprehensive observability features.

## Tech Stack

- **Framework**: NestJS 11 with TypeScript 5
- **Database**: Microsoft SQL Server (MSSQL) with TypeORM 0.3
- **Authentication**: JWT with Passport strategy
- **Validation**: class-validator and class-transformer
- **Observability**: Prometheus metrics, structured logging with nestjs-pino
- **Testing**: Jest 29 for unit and e2e tests
- **Security**: bcrypt for password hashing, Multer for file uploads

## Getting Started

First, run the development server:

```bash
pnpm run dev
# Also works with NPM, YARN, BUN, ...
```

By default, your server will run at [localhost:3000](http://localhost:3000). You can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/) to test your APIs.

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:

- `DB_HOST`, `DB_PORT` (1433), `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (MSSQL connection)
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_EXPIRES_IN`: Token expiration time
- `NODE_ENV`: Environment (development/production)

### Database Setup

The application uses Microsoft SQL Server (MSSQL). Migrations run automatically and seeding sets up default roles and users:

```bash
# Reset database (runs migrations and seeds)
pnpm run reset-db
```

Default seeded accounts:

- Admin: `admin/admin`
- User: `user/user`

## API Endpoints

### Authentication

- `POST /auth/login` - User login (records login activity, returns active workspace slug)
  - Response includes: `access_token`, `user`, and `activeWorkspaceSlug` (optional)
- `POST /auth/change-password` - Change password (records password change activity)
- `GET /auth/profile` - Get current user profile

### Users

- `PUT /users/profile` - Update user profile (records profile update activity)
- `PUT /users/avatar` - Update user avatar (records avatar update activity, max 2MB)
- `GET /users` - List all users (Admin only)
- `PATCH /users/:id/status` - Update user status (Admin only)
- `PATCH /users/:id/role` - Update user role (Admin only)
- `GET /users/roles` - List available roles (Admin only)

### Activities

- `GET /activities` - Get current user's recent activities
  - Query parameters:
    - `limit` (optional, default: 20) - Number of activities to return
    - `cursor` (optional) - Pagination cursor for fetching older activities
  - Requires JWT authentication
  - Returns activities in reverse chronological order (newest first)

### Observability

- `GET /metrics` - Prometheus metrics endpoint
  - HTTP request counters and duration histograms
  - Labeled by method, route pattern, and status code
  - Available for monitoring and alerting

## Database Schema

### Core Entities

**User Entity**

- `id` (UUID, primary key) - Unique user identifier
- `username` (string, unique) - User's login name
- `name` (string) - Display name
- `password` (string, hashed) - Bcrypt-hashed password
- `role` (enum) - User role: `Admin` or `User`
- `avatar` (string, nullable) - Avatar file path
- `isActive` (boolean) - Account status
- `lastActiveWorkspaceId` (UUID, nullable) - ID of user's last active workspace
- `lastActiveWorkspaceAt` (timestamp, nullable) - When workspace was last set as active
- `createdAt`/`updatedAt` (datetime) - Timestamps

**Role Entity**

- `id` (UUID, primary key) - Role identifier
- `name` (string, unique) - Role name
- `description` (string, nullable) - Role description

**Activity Entity**

- `id` (UUID, primary key) - Unique activity identifier
- `ownerId` (string, foreign key) - ID of the user this activity belongs to
- `type` (enum) - Activity type: `login_success`, `profile_updated`, `password_changed`, `avatar_updated`
- `message` (string) - Human-readable activity message
- `metadata` (JSON, nullable) - Optional additional data
- `createdAt` (datetime) - When the activity occurred

### Database Configuration

**Database Engine**: Microsoft SQL Server (MSSQL) in every environment (external instance). TypeORM migrations run automatically at startup (`migrationsRun: true`), and the first boot seeds default roles plus admin (`admin/admin`) and user (`user/user`) accounts for testing.

**Performance**: Index on `(owner_id, createdAt)` keeps activity pagination efficient. Users eager-load roles to avoid N+1 queries.

## Architecture

### Modular Structure

- **AuthModule**: Authentication, JWT strategy, password changes
- **UsersModule**: User management, profile updates, avatar uploads
- **ActivitiesModule**: Activity tracking and feed
- **LoggerModule**: Structured logging with request correlation
- **MetricsModule**: Prometheus metrics collection

### Security Features

- JWT authentication with configurable expiration
- Role-based access control with `@Roles()` decorator
- Password hashing with bcrypt
- Input validation with class-validator
- File upload restrictions (2MB max, images only)
- Request correlation IDs for tracing

### Observability

- **Metrics**: HTTP request counters and duration histograms
- **Logging**: Structured JSON logs with nestjs-pino
- **Request Tracing**: Correlation IDs across request lifecycle
- **Health Checks**: Built-in NestJS health indicators

## Development

### Available Scripts

```bash
# Development
pnpm run dev              # Start development server
pnpm run start            # Start production server
pnpm run build            # Build application
pnpm run test             # Run unit tests
pnpm run test:e2e         # Run e2e tests
pnpm run test:watch       # Run tests in watch mode
pnpm run lint             # Run ESLint linter
pnpm run format           # Format code with Prettier

# Database
pnpm run reset-db         # Reset database (migrations + seeds)
pnpm run migration:generate # Generate new migration
pnpm run migration:run    # Run migrations manually
```

### Testing Strategy

- **Unit Tests**: Service layer business logic
- **Integration Tests**: API endpoints with database
- **E2E Tests**: Complete user flows
- **Key Test Areas**: Authentication, user management, safety rules, activity tracking

### Important Note 🚧

If you plan to `build` or `test` the app, please make sure to build the `packages/*` first.

## Deployment

### Docker Deployment

The application includes Docker support with multi-stage builds:

```bash
# Build Docker image
docker build -t dashboard-api .

# Run with Docker Compose
docker-compose up api
```

### Production Considerations

- Use Microsoft SQL Server with appropriate connection pooling
- Configure JWT secrets via environment variables
- Enable HTTPS in production
- Set up monitoring with Prometheus + Grafana
- Configure log aggregation for structured logs
- Use reverse proxy (Nginx) for SSL termination

## Monitoring & Observability

### Metrics

- HTTP request metrics exposed at `/metrics`
- Request count and duration by route, method, status
- Compatible with Prometheus scraping

### Logging

- Structured JSON logging in production
- Request correlation IDs for distributed tracing
- Sensitive data redaction (passwords, tokens)
- Pretty-printed logs in development

### Health Checks

- `/health` endpoint for application health
- Database connectivity checks
- Ready for Kubernetes liveness/readiness probes

## Learn More

Learn more about `NestJs` with following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)
- [Observability Runbook](../../docs/OBSERVABILITY_RUNBOOK.md) - Detailed monitoring and logging guide
