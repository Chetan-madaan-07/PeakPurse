# PeakPurse Docker Configuration

This directory contains Docker and Docker Compose configurations for the PeakPurse platform.

## Overview

The Docker setup enables easy development environment setup and production deployment of all PeakPurse services:

- **Backend API** (NestJS)
- **Frontend** (Next.js)
- **ML Service** (FastAPI)
- **PostgreSQL** Database
- **Redis** Cache
- **Nginx** Reverse Proxy (Production)

## Quick Start

### Prerequisites

- Docker Desktop
- Docker Compose

### Development Environment

```bash
# Start all development services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

```bash
# Start production services
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration Files

### `docker-compose.yml`

Main Docker Compose configuration for production deployment.

**Services:**
- **postgres**: PostgreSQL 15 database
- **redis**: Redis 7 cache
- **backend**: NestJS API server
- **ml-service**: FastAPI ML service
- **frontend**: Next.js web application
- **nginx**: Nginx reverse proxy (production profile)

**Features:**
- Health checks for all services
- Proper service dependencies
- Volume mounting for data persistence
- Network isolation
- Production optimizations

### `docker-compose.dev.yml`

Development-specific configuration with hot reloading and debugging.

**Development Features:**
- Source code mounting for live reload
- Debug logging enabled
- Development environment variables
- Larger resource limits
- Additional development tools

## Service Details

### PostgreSQL Database

```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: ${DB_DATABASE:-peakpurse_dev}
    POSTGRES_USER: ${DB_USERNAME:-peakpurse_user}
    POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
  ports:
    - "${DB_PORT:-5432}:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-peakpurse_user}"]
```

**Features:**
- Persistent data storage
- Health checks
- Environment variable configuration
- Custom initialization scripts

### Redis Cache

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "${REDIS_PORT:-6379}:6379"
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
```

**Features:**
- In-memory data storage
- Persistence to disk
- Health monitoring
- Configuration flexibility

### Backend API

```yaml
backend:
  build:
    context: ../backend
    dockerfile: Dockerfile
  environment:
    - NODE_ENV=production
    - DB_HOST=postgres
    - REDIS_HOST=redis
  ports:
    - "3000:3000"
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
```

**Features:**
- Multi-stage build optimization
- Service health dependencies
- Environment configuration
- Volume mounting for uploads

### ML Service

```yaml
ml-service:
  build:
    context: ../ml-service
    dockerfile: Dockerfile
  environment:
    - DATABASE_URL=postgresql://user:pass@postgres:5432/db
  ports:
    - "8000:8000"
  depends_on:
    postgres:
      condition: service_healthy
```

**Features:**
- Python-based service
- Model file mounting
- Internal service communication
- Performance optimization

### Frontend

```yaml
frontend:
  build:
    context: ../frontend
    dockerfile: Dockerfile
  environment:
    - NEXT_PUBLIC_API_URL=http://backend:3000
  ports:
    - "3001:3001"
  depends_on:
    - backend
```

**Features:**
- Static optimization
- Environment-specific builds
- API proxy configuration
- Asset optimization

### Nginx (Production)

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    - ./nginx/ssl:/etc/nginx/ssl
  profiles:
    - production
```

**Features:**
- SSL termination
- Load balancing
- Static file serving
- API gateway functionality

## Environment Configuration

### `.env` File

Create a `.env` file in the project root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=peakpurse_user
DB_PASSWORD=your_secure_password
DB_DATABASE=peakpurse_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Ports
BACKEND_PORT=3000
FRONTEND_PORT=3001
ML_SERVICE_PORT=8000

# Security
JWT_SECRET=your_jwt_secret
INTERNAL_SECRET=your_internal_secret
```

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/peakpurse.git
cd peakpurse

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start development services
cd docker
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for services to be ready
docker-compose -f docker-compose.dev.yml logs -f postgres

# Run database migrations
cd ../backend
npm run migration:run

# Start application services
cd ../docker
docker-compose -f docker-compose.dev.yml up -d
```

### Daily Development

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f backend

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend

# Access service shell
docker-compose -f docker-compose.dev.yml exec backend sh
```

### Code Changes

With development configuration, code changes are automatically reflected:

- **Backend**: Hot reload via NestJS
- **Frontend**: Hot reload via Next.js
- **ML Service**: Reload via FastAPI

## Production Deployment

### Build and Deploy

```bash
# Build production images
docker-compose build

# Deploy to production
docker-compose --profile production up -d

# Verify deployment
docker-compose ps
docker-compose logs
```

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker-compose logs backend | grep health
```

### Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Scale frontend service
docker-compose up -d --scale frontend=2
```

## Monitoring

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs for specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Metrics

Services expose metrics endpoints:

- **Backend**: http://localhost:3000/metrics
- **ML Service**: http://localhost:8000/metrics

### Resource Usage

```bash
# View resource usage
docker stats

# View detailed stats
docker stats --no-stream
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   netstat -tulpn | grep :3000
   
   # Change ports in .env file
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Verify database is ready
   docker-compose exec postgres pg_isready
   ```

3. **Volume Permission Issues**
   ```bash
   # Reset permissions
   sudo chown -R $USER:$USER .
   
   # Recreate volumes
   docker-compose down -v
   docker-compose up -d
   ```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
export DEBUG=true

# Restart with debug
docker-compose -f docker-compose.dev.yml up --force-recreate
```

### Clean Start

```bash
# Stop and remove everything
docker-compose -f docker-compose.dev.yml down -v --remove-orphans

# Remove all images
docker system prune -a

# Start fresh
docker-compose -f docker-compose.dev.yml up -d
```

## Security

### Best Practices

1. **Use secrets management** for sensitive data
2. **Regularly update** base images
3. **Scan images** for vulnerabilities
4. **Limit container privileges**
5. **Use read-only filesystems** where possible

### SSL/TLS

For production:

```bash
# Generate SSL certificates
./scripts/generate-ssl.sh

# Update nginx configuration
vim nginx/nginx.conf

# Restart nginx
docker-compose restart nginx
```

## Performance

### Optimization

1. **Use multi-stage builds** to reduce image size
2. **Enable caching** for Docker layers
3. **Use .dockerignore** files
4. **Optimize Dockerfile** instructions

### Resource Limits

```yaml
# Example resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Backup and Recovery

### Database Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U peakpurse_user peakpurse_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U peakpurse_user peakpurse_dev < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v peakpurse_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v peakpurse_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## Contributing

1. **Test changes** in development environment first
2. **Update documentation** for any configuration changes
3. **Use semantic versioning** for image tags
4. **Follow Docker best practices**
5. **Security review** for production changes
