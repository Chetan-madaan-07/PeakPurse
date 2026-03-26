# PeakPurse ML Service

Python FastAPI service providing machine learning capabilities for the PeakPurse financial platform.

## Overview

The ML service handles intelligent features including financial health scoring, transaction categorization, and personalized recommendations. It's designed as a microservice that communicates with the main backend via internal APIs.

## Features

### Core ML Capabilities

- **Financial Health Scoring**: Multi-factor scoring with explainable AI
- **Transaction Categorization**: ML-based classification with user feedback learning
- **Personalized Recommendations**: Rule-based and ML-driven financial advice
- **Anomaly Detection**: Identify unusual spending patterns
- **Benchmarking Analytics**: Cohort analysis with differential privacy

### Technology Stack

- **Framework**: FastAPI with Python 3.11
- **ML Libraries**: scikit-learn, XGBoost, LightGBM
- **Data Processing**: pandas, numpy
- **API Documentation**: OpenAPI/Swagger
- **Async Processing**: asyncio support
- **Database**: PostgreSQL via SQLAlchemy
- **Testing**: pytest with async support

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis (for caching, optional)

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Update .env with your configuration
```

### Development

```bash
# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the Makefile
make dev
```

### Production

```bash
# Start with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or use Docker
docker build -t peakpurse-ml-service .
docker run -p 8000:8000 peakpurse-ml-service
```

## API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Project Structure

```
src/
├── api/                 # API route handlers
│   ├── routes/         # FastAPI routers
│   └── schemas/        # Pydantic models
├── core/               # Core application logic
│   ├── config.py      # Configuration management
│   ├── logging.py     # Logging setup
│   └── exceptions.py  # Custom exceptions
├── models/             # Machine learning models
│   ├── health_score/   # Financial health scoring
│   ├── categorizer/    # Transaction categorization
│   └── recommendations/ # Recommendation engine
├── preprocessing/      # Data preprocessing utilities
├── utils/              # Helper functions
└── tests/              # Test suite
```

## Machine Learning Models

### Financial Health Scoring

```python
# models/health_score/scorer.py
class FinancialHealthScorer:
    def __init__(self):
        self.model = self._load_model()
        self.feature_weights = {
            'savings_rate': 0.25,
            'debt_income_ratio': 0.25,
            'expense_volatility': 0.15,
            'emergency_fund_months': 0.20,
            'investment_ratio': 0.15
        }
    
    def score(self, user_data: UserData) -> HealthScore:
        # Implementation with explainable AI
        pass
```

### Transaction Categorizer

```python
# models/categorizer/transaction_categorizer.py
class TransactionCategorizer:
    def __init__(self):
        self.rule_engine = RuleEngine()
        self.ml_model = self._load_ml_model()
        self.user_preferences = {}
    
    def categorize(self, transaction: Transaction) -> Category:
        # Hybrid approach: rules + ML + user preferences
        pass
```

### Recommendation Engine

```python
# models/recommendations/recommender.py
class RecommendationEngine:
    def generate_recommendations(self, user_data: UserData) -> List[Recommendation]:
        # Rule-based v1, ML-enhanced v2+
        pass
```

## API Endpoints

### Internal Endpoints (Backend Only)

All endpoints require internal authentication via `X-Internal-Secret` header.

#### Health Score

```http
POST /internal/ml/health-score
Content-Type: application/json
X-Internal-Secret: your_secret

{
  "user_id": "uuid",
  "financial_data": {
    "income": 50000,
    "expenses": 35000,
    "savings": 15000,
    "debts": 5000,
    "investments": 10000
  }
}
```

#### Recommendations

```http
POST /internal/ml/recommendations
Content-Type: application/json
X-Internal-Secret: your_secret

{
  "user_id": "uuid",
  "profile": {
    "risk_profile": "moderate",
    "goals": ["emergency_fund", "house_down_payment"],
    "spending_patterns": {...}
  }
}
```

#### Categorization

```http
POST /internal/ml/categorize
Content-Type: application/json
X-Internal-Secret: your_secret

{
  "transactions": [
    {
      "merchant_name": "Starbucks",
      "amount": 450,
      "description": "Coffee and snacks"
    }
  ]
}
```

### Public Endpoints

#### Health Check

```http
GET /health
```

## Model Training

### Data Preparation

```python
# preprocessing/data_prep.py
def prepare_training_data(transactions_df: pd.DataFrame) -> pd.DataFrame:
    # Clean and preprocess transaction data
    # Feature engineering
    # Handle missing values
    pass
```

### Training Pipeline

```python
# scripts/train_models.py
def train_health_score_model():
    # Load training data
    # Feature engineering
    # Model training with cross-validation
    # Hyperparameter tuning
    # Model evaluation
    # Model serialization
    pass
```

### Model Evaluation

```python
# tests/test_models.py
def test_health_score_accuracy():
    # Test model accuracy on held-out test set
    # Verify feature importance consistency
    # Test edge cases
    pass
```

## Configuration

### Environment Variables

```env
# Application
DEBUG=true
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/peakpurse_dev

# Internal Authentication
INTERNAL_SECRET=your_secret_key

# Backend Integration
BACKEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Model Configuration
MODEL_PATH=./models
MODEL_VERSION=1.0

# Performance
MAX_WORKERS=4
BATCH_SIZE=100

# Cache
CACHE_TTL=3600

# Monitoring
PROMETHEUS_ENABLED=true
```

### Model Configuration

```python
# core/config.py
class Settings:
    # Model paths and versions
    HEALTH_SCORE_MODEL_PATH: str = "./models/health_score_v1.pkl"
    CATEGORIZER_MODEL_PATH: str = "./models/categorizer_v1.pkl"
    
    # Feature engineering
    MIN_TRANSACTIONS_FOR_SCORING: int = 30
    CATEGORY_CONFIDENCE_THRESHOLD: float = 0.8
    
    # Performance
    MAX_BATCH_SIZE: int = 100
    REQUEST_TIMEOUT: int = 30
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_health_score.py

# Run with verbose output
pytest -v
```

### Test Structure

```python
# tests/test_health_score.py
class TestHealthScore:
    def test_score_calculation(self):
        # Test score calculation logic
        pass
    
    def test_feature_contributions(self):
        # Test explainability features
        pass
    
    def test_edge_cases(self):
        # Test with minimal data
        pass
```

## Performance

### Optimization Strategies

- **Batch Processing**: Process multiple transactions in batches
- **Model Caching**: Cache loaded models in memory
- **Feature Caching**: Cache expensive feature calculations
- **Async Processing**: Use asyncio for concurrent operations

### Monitoring

- **Response Time**: Track API response times
- **Model Performance**: Monitor prediction accuracy
- **Resource Usage**: CPU and memory monitoring
- **Error Rates**: Track prediction failures

## Model Management

### Version Control

```python
# models/model_registry.py
class ModelRegistry:
    def __init__(self):
        self.models = {}
        self.load_models()
    
    def load_models(self):
        # Load models with version tracking
        pass
    
    def get_model(self, model_name: str, version: str = "latest"):
        # Retrieve specific model version
        pass
```

### Model Updates

```bash
# Train new model version
python scripts/train_models.py --version 2.0

# Test new model
python scripts/test_model.py --version 2.0

# Deploy new model
python scripts/deploy_model.py --version 2.0
```

## Security

### Authentication

- Internal API authentication via shared secret
- Request validation and rate limiting
- Input sanitization and validation

### Data Privacy

- No sensitive data stored in model artifacts
- Differential privacy for benchmarking
- Secure model storage and transfer

## Deployment

### Docker

```dockerfile
# Multi-stage build for production
FROM python:3.11-slim as base
# ... build stages
```

### Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: peakpurse-ml-service
spec:
  # ... deployment configuration
```

### Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Alertmanager**: Alerting
- **Jaeger**: Distributed tracing (optional)

## Contributing

1. Follow Python best practices (PEP 8)
2. Write comprehensive tests
3. Document model changes
4. Use type hints consistently
5. Follow semantic versioning for models

## Support

For ML service issues:
- Check the API documentation
- Review model performance metrics
- Create an issue with reproduction steps
- Contact the ML engineering team
