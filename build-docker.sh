#!/bin/bash

# Docker build script for Linux AMD64 cross-compilation
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_IMAGE=${API_IMAGE:-"twsbpmac/dashboard-api"}
WEB_IMAGE=${WEB_IMAGE:-"twsbpmac/dashboard-web"}
TAG=${TAG:-"latest"}
PLATFORM=${PLATFORM:-"linux/amd64"}
GIT_TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

echo -e "${GREEN}🐳 Building Docker images for platform: ${PLATFORM}${NC}"

# Function to build image
build_image() {
    local service=$1
    local dockerfile=$2
    local image_name=$3
    local context=${4:-"."}
    
    echo -e "${YELLOW}Building ${service} image (${image_name})...${NC}"
    
    docker buildx build \
        --platform ${PLATFORM} \
        --file ${dockerfile} \
        --tag ${image_name}:${TAG} \
        --tag ${image_name}:${GIT_TAG} \
        --load \
        ${context}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${service} image built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build ${service} image${NC}"
        exit 1
    fi
}

# Check if docker buildx is available
if ! docker buildx version >/dev/null 2>&1; then
    echo -e "${RED}❌ docker buildx is not available. Please install docker buildx.${NC}"
    exit 1
fi

# Create and use buildx builder
echo -e "${YELLOW}Setting up buildx builder...${NC}"
docker buildx create --use --name multiarch-builder --driver docker-container 2>/dev/null || true
docker buildx inspect --bootstrap

# Build API image
build_image "API" "apps/api/Dockerfile" "${API_IMAGE}"

# Build Web image
build_image "Web" "apps/web/Dockerfile" "${WEB_IMAGE}"

# Show built images
echo -e "${GREEN}📋 Built images:${NC}"
docker images | grep -E "${API_IMAGE}|${WEB_IMAGE}" || true

# Optional: Push to registry
if [ "$1" = "--push" ]; then
    echo -e "${YELLOW}Pushing images to registry...${NC}"
    docker push ${API_IMAGE}:${TAG}
    docker push ${API_IMAGE}:${GIT_TAG}
    docker push ${WEB_IMAGE}:${TAG}
    docker push ${WEB_IMAGE}:${GIT_TAG}
    echo -e "${GREEN}✅ Images pushed to registry${NC}"
fi

echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo -e "${YELLOW}To run the application:${NC}"
echo "  docker-compose -f docker-compose.prod.yml up -d"
