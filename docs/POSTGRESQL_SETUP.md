# PostgreSQL Setup Guide

This guide covers setting up PostgreSQL for the dashboard application.

## Overview

The application now supports both PostgreSQL and MSSQL databases, with PostgreSQL being the recommended choice for new deployments.

## Why PostgreSQL?

- **Better JSON Support**: Native `jsonb` type with indexing capabilities
- **Performance**: Generally better performance for read-heavy workloads
- **Open Source**: No licensing restrictions
- **Community**: Larger community and ecosystem
- **Features**: Advanced features like window functions, CTEs, and full-text search

## Quick Setup with Docker

### 1. Start PostgreSQL Container

```bash
# Start PostgreSQL service
docker-compose up -d postgres

# Verify container is running
docker-compose ps
```

### 2. Configure Environment

Copy and configure the environment file:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database Configuration
DB_TYPE=postgres

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres101
DB_DATABASE=tc_studio
```

### 3. Run Database Setup

```bash
# Navigate to API directory
cd apps/api

# Run database migrations
npm run migration:run

# Reset database with seed data (optional)
npm run db:reset
```

## Manual PostgreSQL Setup

### 1. Install PostgreSQL

**macOS (Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE tc_studio;

# Create user (optional, if not using default postgres user)
CREATE USER tc_studio_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tc_studio TO tc_studio_user;

# Exit psql
\q
```

### 3. Configure Application

Update `.env` file:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tc_studio_user  # or postgres
DB_PASSWORD=your_secure_password
DB_DATABASE=tc_studio
```

## Migration from MSSQL

If you're migrating from an existing MSSQL setup:

### 1. Backup Existing Data

```bash
# Export data from MSSQL (using your preferred method)
# This is database-specific and depends on your tools
```

### 2. Switch Database Configuration

Update `.env`:

```env
DB_TYPE=postgres
# ... other PostgreSQL settings
```

### 3. Run PostgreSQL Setup

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Run migrations
npm run migration:run

# Import your data (this step depends on your migration strategy)
```

## Database Schema Differences

### Data Type Mappings

| MSSQL              | PostgreSQL  | Notes                                     |
| ------------------ | ----------- | ----------------------------------------- |
| `datetime2`        | `timestamp` | Both support high precision timestamps    |
| `simple-json`      | `jsonb`     | PostgreSQL has native JSON with indexing  |
| `varchar(max)`     | `text`      | PostgreSQL handles large text efficiently |
| `uniqueidentifier` | `uuid`      | Both support UUID primary keys            |
| `bit`              | `boolean`   | Boolean handling                          |

### Indexes

PostgreSQL automatically creates indexes for:

- Primary keys
- Unique constraints
- Foreign key constraints

Additional indexes are created via migrations for performance:

- Activities by owner and creation time
- Activities by workspace and creation time
- Workspaces by slug
- Workspace members by workspace and role
- Workspace members by user

## Performance Tuning

### 1. Connection Pooling

The application uses TypeORM's built-in connection pooling. For high-traffic deployments, consider:

```env
# Add to .env for production
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
```

### 2. PostgreSQL Configuration

For production, tune PostgreSQL in `postgresql.conf`:

```ini
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings
max_connections = 100

# Logging
log_statement = 'all'
log_duration = on
```

## Troubleshooting

### Connection Issues

**Error**: `ECONNREFUSED`

- **Solution**: Ensure PostgreSQL is running and accessible on configured port

**Error**: `authentication failed`

- **Solution**: Verify username/password in `.env` matches PostgreSQL user

**Error**: `database does not exist`

- **Solution**: Create database: `createdb dashboard`

### Migration Issues

**Error**: `relation already exists`

- **Solution**: Reset database: `npm run db:reset`

**Error**: `column does not exist`

- **Solution**: Check entity definitions and regenerate migrations

### Performance Issues

**Slow Queries**:

- Check indexes: `\d+ table_name` in psql
- Analyze query plans: `EXPLAIN ANALYZE your_query`
- Consider adding specific indexes

**High Memory Usage**:

- Tune PostgreSQL memory settings
- Check connection pool size
- Monitor with: `SELECT * FROM pg_stat_activity;`

## Monitoring

### PostgreSQL Metrics

Connect to PostgreSQL and check status:

```bash
# Connect to database
psql -h localhost -U postgres -d tc_studio

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('tc_studio'));

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Application Monitoring

The application includes Prometheus metrics that can track:

- Database connection pool status
- Query execution times
- Error rates
- Active connections

Access Grafana at `http://localhost:3001` (when running with observability stack).

## Backup and Recovery

### Automated Backups

```bash
# Create backup script
cat > backup-postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec tcstudio-postgres-dev pg_dump -U postgres tc_studio > "$BACKUP_DIR/tc_studio_$DATE.sql"
EOF

chmod +x backup-postgres.sh

# Run daily (add to cron)
0 2 * * * /path/to/backup-postgres.sh
```

### Manual Backup

```bash
# Backup from Docker container
docker exec tcstudio-postgres-dev pg_dump -U postgres tc_studio > backup.sql

# Restore from backup
docker exec -i tcstudio-postgres-dev psql -U postgres tc_studio < backup.sql
```

## Security Considerations

1. **Use Environment Variables**: Never commit database credentials
2. **Network Security**: Use Docker networks or VPNs
3. **Password Security**: Use strong, unique passwords
4. **Regular Updates**: Keep PostgreSQL updated
5. **Access Control**: Limit database user permissions
6. **Encryption**: Use SSL for production connections

## Next Steps

- [ ] Configure production PostgreSQL instance
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Test disaster recovery procedures
- [ ] Optimize performance for your workload
