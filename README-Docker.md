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
   - PostgreSQL database with automatic migrations and seed data
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
   - Database: localhost:5432

## Configuration

### Environment Variables

Key environment variables for production:

```bash
# Database
DB_HOST=db
DB_PORT=5432
DB_USERNAME=dashboard
DB_PASSWORD=your-secure-password
DB_DATABASE=dashboard

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# API
API_BASE_URL=https://your-domain.com
```

### Database Configuration

**Development & Production:** Use PostgreSQL 15 with persistent volumes.

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

### Database Service
- **Port:** 5432
- **Engine:** PostgreSQL 15
- **Persistence:** Docker volume
- **Resources:** 1GB limit, 512MB reservation

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
   - Check if ports 80, 3000, 5432 are available
   - Modify ports in docker-compose files if needed

2. **Permission issues:**
   ```bash
   sudo chown -R $USER:$USER ./backups
   ```

3. **Database connection:**
   - Ensure database is healthy: `docker-compose exec db pg_isready`
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
   - Monitor connections: `docker-compose exec db psql -U dashboard -c "SELECT * FROM pg_stat_activity;"`
   - Adjust PostgreSQL settings in docker-compose.prod.yml

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
