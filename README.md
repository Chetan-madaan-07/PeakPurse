# PeakPurse 🇮🇳

<div align="center">

![PeakPurse Logo](https://via.placeholder.com/200x80/3b82f6/ffffff?text=PeakPurse)

**Intelligent Personal Finance Platform for India**

A comprehensive web-based platform that unifies budgeting, tax filing, CA discovery, social benchmarking, subscription tracking, investment planning, and AI-powered financial assistance.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

[Documentation](docs/) • [Live Demo](https://demo.peakpurse.com) • [API Reference](https://api.peakpurse.com/docs)

</div>

## 🌟 Overview

PeakPurse is a modern, India-first personal finance platform designed to help users take control of their financial health through intelligent automation, explainable insights, and goal-driven recommendations. Built with compliance to Indian regulations including the DPDP Act 2023, Income Tax Act, and SEBI guidelines.

### 🎯 Key Features

- **🏦 Intelligent Budget Management** - AI-powered expense categorization and smart budget allocation
- **📊 Financial Health Scoring** - Multi-factor scoring with actionable improvement recommendations
- **🧾 AI Tax Filing Assistant** - Guided ITR preparation with auto-fill and deduction discovery
- **👨‍💼 Smart CA Finder** - Discover and connect with verified Chartered Accountants
- **📈 Social Benchmarking** - Anonymous peer comparisons with differential privacy
- **💬 Conversational AI Assistant** - Natural language interface for all platform features
- **📱 Subscription Intelligence** - Automatic detection and optimization of recurring charges
- **🎯 Goal-Based Investment Planning** - Personalized investment strategies with risk profiling

## 🏗️ Architecture

PeakPurse follows a modular monolith architecture designed to evolve into microservices as scale demands:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   ML Service    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (FastAPI)     │
│   Port: 3001    │    │   Port: 3000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Port: 5432    │
                       └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend**: NestJS, TypeScript, PostgreSQL, Redis, BullMQ
- **ML Service**: FastAPI, Python 3.11, scikit-learn, XGBoost
- **Infrastructure**: Docker, Docker Compose, Nginx
- **Database**: PostgreSQL 15 with TypeORM
- **Cache**: Redis 7 for session management and caching
- **Queue**: BullMQ for background job processing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ and pip
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (recommended)

### 🐳 Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/peakpurse.git
   cd peakpurse
   ```

2. **Setup environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with your configuration
   # Update database passwords, JWT secrets, etc.
   ```

3. **Start development environment**
   ```bash
   cd docker
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Run database migrations**
   ```bash
   cd ../backend
   npm run migration:run
   ```

5. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/docs
   - ML Service: http://localhost:8000/docs

### 🛠️ Manual Setup

1. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run migration:run
   npm run start:dev
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

3. **Setup ML Service**
   ```bash
   cd ml-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   uvicorn main:app --reload
   ```

## 📁 Project Structure

```
peakpurse/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/           # Authentication & consent
│   │   ├── finance/        # Financial data management
│   │   ├── tax/           # Tax filing system
│   │   ├── ca/            # CA directory
│   │   ├── benchmarking/  # Social comparisons
│   │   ├── chatbot/       # AI assistant
│   │   ├── investment/    # Investment planning
│   │   ├── notification/  # Notifications
│   │   └── audit/         # Audit trails
│   ├── test/              # Test suite
│   └── config/            # Configuration files
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
├── ml-service/             # Python ML service
│   ├── src/
│   │   ├── api/           # FastAPI routes
│   │   ├── models/        # ML models
│   │   ├── core/          # Core logic
│   │   └── utils/         # Utilities
│   └── tests/             # Test suite
├── database/               # Database files
│   ├── migrations/        # TypeORM migrations
│   ├── seeds/             # Seed data
│   └── schemas/           # Schema definitions
├── docker/                 # Docker configurations
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── nginx/             # Nginx configuration
├── scripts/                # Utility scripts
│   ├── setup.sh          # Linux/Mac setup
│   └── setup.ps1         # Windows setup
├── docs/                   # Documentation
└── deployments/            # Deployment configs
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```env
# Application
APP_ENV=development
APP_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=peakpurse_user
DB_PASSWORD=your_secure_password
DB_DATABASE=peakpurse_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# ML Service
ML_SERVICE_URL=http://localhost:8000
INTERNAL_SECRET=your_internal_service_secret

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

For complete configuration, see:
- [Backend Environment](backend/.env.example)
- [Frontend Environment](frontend/.env.example)
- [ML Service Environment](ml-service/.env.example)

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run unit tests
npm run test

# Run integration tests
npm run test:e2e

# Run with coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run Storybook
npm run storybook
```

### ML Service Tests

```bash
cd ml-service

# Run tests
pytest

# Run with coverage
pytest --cov=src
```

## 🚀 Deployment

### Development

```bash
# Start all services
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

### Production

```bash
# Build and deploy
docker-compose --profile production up -d

# With SSL/HTTPS
./scripts/setup-ssl.sh
docker-compose --profile production up -d
```

### Cloud Deployment

The platform is designed for deployment on:

- **AWS**: ECS, RDS, ElastiCache, ALB
- **Google Cloud**: GKE, Cloud SQL, Memorystore
- **Azure**: AKS, Azure Database, Redis Cache
- **DigitalOcean**: App Platform, Managed Databases

See [Deployment Guide](docs/deployment.md) for detailed instructions.

## 📊 Monitoring & Observability

### Health Checks

- **Backend**: `/health`
- **ML Service**: `/health`
- **Database**: PostgreSQL health checks
- **Redis**: Redis ping checks

### Metrics

- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Structured Logging**: JSON logs with correlation IDs
- **Error Tracking**: Sentry integration

### Performance Monitoring

- **Response Time**: API latency tracking
- **Database Performance**: Query optimization
- **Resource Usage**: CPU, memory, disk monitoring
- **User Experience**: Web Vitals tracking

## 🔒 Security & Compliance

### Security Features

- **Authentication**: JWT with refresh tokens, TOTP 2FA
- **Authorization**: Role-based access control
- **Data Encryption**: TLS 1.3, encrypted storage
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API throttling and abuse prevention
- **Audit Trails**: Complete audit logging

### Compliance

- **DPDP Act 2023**: Data protection and privacy
- **Income Tax Act**: Tax computation compliance
- **SEBI RIA**: Investment advisory regulations
- **RBI Guidelines**: Digital lending standards

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **Python**: PEP 8 compliance
- **Testing**: Minimum 80% coverage
- **Documentation**: Updated READMEs and API docs
- **Security**: Security review for all changes

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Architecture Overview](docs/architecture.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guidelines](docs/security.md)
- [ML Models](docs/ml-models.md)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose logs postgres
   
   # Verify connection string
   docker-compose exec backend npm run migration:run
   ```

2. **Port Conflicts**
   ```bash
   # Check what's using ports
   netstat -tulpn | grep :3000
   
   # Change ports in .env file
   ```

3. **Build Failures**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild from scratch
   docker-compose build --no-cache
   ```

### Getting Help

- 📖 Check the [Documentation](docs/)
- 🐛 [Report an Issue](https://github.com/your-org/peakpurse/issues)
- 💬 [Join our Discord](https://discord.gg/peakpurse)
- 📧 [Email Support](mailto:support@peakpurse.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **NestJS Team** - For the excellent Node.js framework
- **FastAPI Team** - For the modern Python web framework
- **Indian Fintech Community** - For inspiration and feedback

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-org/peakpurse&type=Date)](https://star-history.com/#your-org/peakpurse&Date)

---

<div align="center">

**Built with ❤️ for India's financial future**

[Website](https://peakpurse.com) • [Blog](https://blog.peakpurse.com) • [Careers](https://peakpurse.com/careers)

</div>