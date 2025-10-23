# Docker Deployment Guide

This guide covers how to deploy and run the Dashboard application using Docker containers.

## Prerequisites

- Docker 20.10+ with Docker Compose
- Docker Buildx (for multi-platform builds)
- At least 2GB RAM available for Docker

## Quick Start

### Development Environment

1. **Clone and setup:**

   ```bash
   git clone <repository-url>
   cd tc
   cp .env.docker .env
   ```

2. **Start development containers:**

   ```bash
   npm run docker:dev
   ```

   This will start:
   - API service on http://localhost:3000
   - Web app on http://localhost:5173
   - Connects to your external MSSQL database; migrations and seeds run automatically
   - Redis cache (optional, start with `--profile redis`)

3. **View logs:**

   ```bash
   npm run docker:dev:logs
   ```

4. **Stop containers:**
   ```bash
   npm run docker:dev:stop
   ```

### Production Environment

1. **Configure environment:**

   ```bash
   cp .env.docker .env
   # Edit .env with your production values
   ```

2. **Build and deploy:**

   ```bash
   # Build images for Linux AMD64
   npm run docker:build

   # Deploy to production
   npm run deploy
   ```

3. **Access the application:**
   - Web app: http://localhost (or your domain)
   - API: http://localhost:3000
   - Database: External SQL Server (configure host/port/user/password)

## Configuration

### Environment Variables

Key environment variables for production:

```bash
# Database (MSSQL)
DB_HOST=<your-mssql-host>
DB_PORT=1433
DB_USERNAME=<your-username>
DB_PASSWORD=<your-password>
DB_DATABASE=dashboard

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# API
API_BASE_URL=https://your-domain.com
```

### Database Configuration

**Development & Production:** Use an external Microsoft SQL Server. No database container is included.

Migrations run automatically when the API container starts, and the first boot seeds default admin (`admin/nimda`) and user (`user/user123`) accounts.

## Build and Deployment

### Building Images

Build for local Linux AMD64:

```bash
npm run docker:build
```

Build and push to registry:

```bash
npm run docker:build:push
```

### Deployment Commands

```bash
# Deploy application
npm run deploy

# Rollback deployment
npm run deploy:rollback

# View deployment logs
npm run deploy:logs

# Health check
npm run deploy:health
```

### Manual Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# With nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile nginx up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale api=2
```

## Services

### API Service

- **Port:** 3000
- **Health Check:** `/health`
- **Environment:** NODE_ENV=production
- **Resources:** 512MB limit, 256MB reservation

### Web Service

- **Port:** 80 (via nginx)
- **Technology:** Nginx serving static React build
- **Resources:** 128MB limit, 64MB reservation

### Database

- External SQL Server (MSSQL)
- Provided and managed outside Docker Compose

### Redis Service

- **Port:** 6379
- **Persistence:** AOF enabled
- **Memory Limit:** 256MB
- **Policy:** allkeys-lru

## Monitoring and Maintenance

### Health Checks

All services include health checks:

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs api
```

### Database Backups

Automatic backups during deployment:

```bash
# Manual backup
./deploy.sh backup

# View backups
ls -la ./backups/
```

### Log Management

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# Follow logs
docker-compose -f docker-compose.prod.yml logs -f

# Service-specific logs
docker-compose -f docker-compose.prod.yml logs api
```

## SSL/TLS Configuration

For production with HTTPS:

1. **Place SSL certificates:**

   ```bash
   mkdir -p nginx/ssl
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

2. **Enable nginx profile:**
   ```bash
   docker-compose -f docker-compose.prod.yml --profile nginx up -d
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Check if ports 80, 3000, 1433 are available
   - Modify ports in docker-compose files if needed

2. **Permission issues:**

   ```bash
   sudo chown -R $USER:$USER ./backups
   ```

3. **Database connection:**
   - Verify database connectivity from API container: `docker-compose exec api /bin/sh -lc "sqlcmd -S $DB_HOST,$DB_PORT -U $DB_USERNAME -P $DB_PASSWORD -Q 'SELECT 1'"`
   - Check environment variables in .env file

4. **Build failures:**
   - Clear Docker cache: `docker system prune -a`
   - Check disk space: `docker system df`

### Debug Mode

Run services with debug logging:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

### Performance Tuning

1. **Database optimization:**
   - Monitor connections: connect with sqlcmd and query DMVs, e.g., `SELECT COUNT(*) FROM sys.dm_exec_sessions;`
   - Adjust SQL Server settings on your database host (outside Compose)

2. **Resource limits:**
   - Monitor resource usage: `docker stats`
   - Adjust memory/CPU limits in compose files

## Security Considerations

- Change default passwords in production
- Use strong JWT secrets
- Enable HTTPS in production
- Regularly update base images
- Implement proper backup strategies
- Monitor security advisories for dependencies

## Support

For issues:

1. Check logs: `npm run deploy:logs`
2. Verify health: `npm run deploy:health`
3. Review configuration in .env file
4. Check Docker resource availability
