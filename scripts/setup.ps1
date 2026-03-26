# PeakPurge Development Setup Script (PowerShell)
# This script sets up the development environment for PeakPurse

Write-Host "🚀 Setting up PeakPurse development environment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
    Write-Host "✅ Node.js is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18 or higher." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
try {
    python --version | Out-Null
    Write-Host "✅ Python is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3 is not installed. Please install Python 3.11 or higher." -ForegroundColor Red
    exit 1
}

# Create environment file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update the .env file with your configuration values." -ForegroundColor Yellow
}

# Create backend environment file
if (-not (Test-Path backend\.env)) {
    Write-Host "📝 Creating backend .env file..." -ForegroundColor Yellow
    Copy-Item backend\.env.example backend\.env
}

# Create frontend environment file
if (-not (Test-Path frontend\.env)) {
    Write-Host "📝 Creating frontend .env file..." -ForegroundColor Yellow
    Copy-Item frontend\.env.example frontend\.env
}

# Create ML service environment file
if (-not (Test-Path ml-service\.env)) {
    Write-Host "📝 Creating ML service .env file..." -ForegroundColor Yellow
    Copy-Item ml-service\.env.example ml-service\.env
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
Set-Location backend
npm install
Set-Location ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
Set-Location frontend
npm install
Set-Location ..

# Install ML service dependencies
Write-Host "📦 Installing ML service dependencies..." -ForegroundColor Blue
Set-Location ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
Set-Location ..

# Start development services
Write-Host "🐳 Starting development services..." -ForegroundColor Blue
Set-Location docker
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Blue
Set-Location ..\backend
npm run migration:run
Set-Location ..

Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update the .env files with your configuration values"
Write-Host "2. Start the development servers:"
Write-Host "   cd docker && docker-compose -f docker-compose.dev.yml up"
Write-Host "3. Visit http://localhost:3001 to access the application"
Write-Host "4. Backend API is available at http://localhost:3000"
Write-Host "5. ML Service is available at http://localhost:8000"
Write-Host ""
Write-Host "📚 For more information, see the README files in each service directory." -ForegroundColor Cyan
