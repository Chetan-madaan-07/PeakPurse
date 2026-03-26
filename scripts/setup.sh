#!/bin/bash

# PeakPurge Development Setup Script
# This script sets up the development environment for PeakPurse

set -e

echo "🚀 Setting up PeakPurse development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration values."
fi

# Create backend environment file
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
fi

# Create frontend environment file
if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file..."
    cp frontend/.env.example frontend/.env
fi

# Create ML service environment file
if [ ! -f ml-service/.env ]; then
    echo "📝 Creating ML service .env file..."
    cp ml-service/.env.example ml-service/.env
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install ML service dependencies
echo "📦 Installing ML service dependencies..."
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Start development services
echo "🐳 Starting development services..."
cd docker
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
cd ../backend
npm run migration:run
cd ..

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update the .env files with your configuration values"
echo "2. Start the development servers:"
echo "   cd docker && docker-compose -f docker-compose.dev.yml up"
echo "3. Visit http://localhost:3001 to access the application"
echo "4. Backend API is available at http://localhost:3000"
echo "5. ML Service is available at http://localhost:8000"
echo ""
echo "📚 For more information, see the README files in each service directory."
