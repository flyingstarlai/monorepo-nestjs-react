#!/bin/bash

# Deployment script for Docker containers
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-"production"}
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a ${LOG_FILE}
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create backup
create_backup() {
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${YELLOW}📦 Skipping database backup (external MSSQL managed outside Compose)${NC}"
        mkdir -p ${BACKUP_DIR}
        echo "Backups should be performed using your SQL Server tooling (e.g., BACKUP DATABASE)." | tee -a ${LOG_FILE}
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    
    docker-compose -f ${COMPOSE_FILE} exec api npm run migration:run
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations completed${NC}"
    else
        echo -e "${RED}❌ Migration failed${NC}"
        exit 1
    fi
}

# Function to health check
health_check() {
    echo -e "${YELLOW}🏥 Performing health checks...${NC}"
    
    # Wait for services to start
    sleep 30
    
    # Check API health
    API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
    if [ "$API_HEALTH" = "200" ]; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${RED}❌ API health check failed (HTTP $API_HEALTH)${NC}"
        return 1
    fi
    
    # Check Web health
    WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
    if [ "$WEB_HEALTH" = "200" ]; then
        echo -e "${GREEN}✅ Web is healthy${NC}"
    else
        echo -e "${RED}❌ Web health check failed (HTTP $WEB_HEALTH)${NC}"
        return 1
    fi
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Recent logs:${NC}"
    docker-compose -f ${COMPOSE_FILE} logs --tail=50
}

# Function to rollback
rollback() {
    echo -e "${YELLOW}🔄 Rolling back deployment...${NC}"
    
    # Stop current services
    docker-compose -f ${COMPOSE_FILE} down

    # Database rollback is managed externally for MSSQL
    if [ -f "${BACKUP_DIR}/rollback.sql" ]; then
        echo -e "${YELLOW}⚠️  Detected ${BACKUP_DIR}/rollback.sql but DB rollback is not handled by this script. Use your MSSQL tooling to restore.${NC}"
    fi
    
    # Restart services
    docker-compose -f ${COMPOSE_FILE} up -d
    
    echo -e "${GREEN}✅ Rollback completed (application only)${NC}"
}

# Main deployment function
deploy() {
    log "Starting deployment for environment: $ENVIRONMENT"
    
    # Check prerequisites
    if ! command_exists docker; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ] && [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${RED}❌ .env file is required for production deployment${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🚀 Starting deployment...${NC}"
    
    # Create backup
    create_backup
    
    # Pull latest images
    echo -e "${YELLOW}📥 Pulling latest images...${NC}"
    docker-compose -f ${COMPOSE_FILE} pull
    
    # Stop existing services
    echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
    docker-compose -f ${COMPOSE_FILE} down
    
    # Start new services
    echo -e "${YELLOW}🔄 Starting new services...${NC}"
    docker-compose -f ${COMPOSE_FILE} up -d
    
    # Run migrations
    run_migrations
    
    # Health check
    if health_check; then
        echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
        log "Deployment completed successfully"
    else
        echo -e "${RED}❌ Deployment failed health checks${NC}"
        log "Deployment failed health checks"
        
        # Ask for rollback
        read -p "Do you want to rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        fi
        exit 1
    fi
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "logs")
        show_logs
        ;;
    "health")
        health_check
        ;;
    "backup")
        create_backup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|logs|health|backup}"
        echo "  deploy  - Deploy the application"
        echo "  rollback - Rollback to previous version"
        echo "  logs    - Show recent logs"
        echo "  health  - Perform health checks"
        echo "  backup  - Create database backup"
        exit 1
        ;;
esac