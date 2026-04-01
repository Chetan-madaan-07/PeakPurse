# PeakPurse Backend

NestJS-based backend API for the PeakPurse intelligent personal finance platform.

## Overview

The backend is built as a modular monolith with clear domain boundaries, designed to evolve into microservices as the application scales. It provides RESTful APIs for all financial operations, user management, and integrations.

## Architecture

### Core Modules

- **Auth & Consent** - User authentication, JWT tokens, 2FA, consent management
- **Finance** - Accounts, transactions, budgets, goals, subscriptions, health scores
- **Tax** - Tax profiles, deduction modeling, ITR preparation
- **CA Directory** - Chartered accountant discovery and lead management
- **Benchmarking** - Social financial comparisons with differential privacy
- **Chatbot** - Conversational AI interface orchestration
- **Investment** - Goal-based investment planning and risk profiling
- **Notification** - Email, in-app, and push notifications
- **Audit** - Comprehensive audit trails and compliance logging

### Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Queue**: BullMQ with Redis
- **Authentication**: JWT with refresh tokens, TOTP 2FA
- **Validation**: Class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with supertest

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Update .env with your configuration values
```

### Database Setup

```bash
# Run migrations
npm run migration:run

# Seed database (optional)
npm run seed
```

### Development

```bash
# Start development server
npm run start:dev

# Start with debugging
npm run start:debug

# Run tests
npm run test

# Run tests with coverage
npm run test:cov
```

### Production

```bash
# Build application
npm run build

# Start production server
npm run start:prod
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## Key Features

### Authentication & Security

- JWT access tokens (15 min expiry) with refresh tokens (7 days)
- TOTP-based 2FA support
- Role-based access control (User, CA, Admin)
- Account lockout after failed attempts
- Device fingerprinting
- Rate limiting (100 req/min per IP)

### Data Management

- Transaction categorization with ML integration
- Budget management with real-time utilization
- Goal feasibility analysis
- Subscription detection and tracking
- Financial health scoring
- Tax profile management

### Compliance & Privacy

- DPDP Act 2023 compliant consent management
- Audit trails for all operations
- Data minimization and purpose limitation
- Differential privacy for benchmarking
- Secure data deletion workflows

## Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=peakpurse_user
DB_PASSWORD=your_password
DB_DATABASE=peakpurse_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=30m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

## Database Schema

The backend uses TypeORM entities defined in each module. Key entities:

- `users` - User accounts and profiles
- `accounts` - Bank accounts, cards, wallets
- `transactions` - Financial transactions
- `categories` - Hierarchical expense categories
- `budgets` - Monthly spending limits
- `goals` - Financial goals with feasibility
- `health_score_snapshots` - Financial health scores
- `tax_profiles` - Per-FY tax information
- `consent_records` - User consent tracking

## Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:e2e

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Deployment

### Docker

```bash
# Build image
docker build -t peakpurse-backend .

# Run container
docker run -p 3000:3000 peakpurse-backend
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

## Monitoring

- Health check endpoint: `/health`
- Metrics endpoint: `/metrics` (if enabled)
- Structured JSON logging with correlation IDs
- Prometheus metrics (optional)

## Security Considerations

- All endpoints protected by authentication
- Input validation and sanitization
- SQL injection prevention via TypeORM
- XSS protection headers
- CSRF protection
- Rate limiting and throttling
- Encrypted sensitive data at rest

## Performance

- Database connection pooling
- Redis caching for frequent queries
- Async job processing for heavy operations
- Compression middleware
- Optimized database queries with proper indexing

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use semantic versioning
5. Follow Git commit conventions

## Support

For technical support:
- Check the API documentation
- Review the logs
- Create an issue in the repository
- Contact the development team
