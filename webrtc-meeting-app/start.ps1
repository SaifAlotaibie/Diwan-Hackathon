# WebRTC Meeting App - Startup Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Starting WebRTC Meeting App" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install from https://python.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install backend dependencies
Write-Host "Backend..." -ForegroundColor Cyan
Set-Location backend
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "✅ Backend dependencies already installed" -ForegroundColor Green
}

# Install frontend dependencies
Set-Location ../frontend
Write-Host "Frontend..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
}

Set-Location ..

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Ollama (Terminal 1):" -ForegroundColor Cyan
Write-Host "   ollama serve" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Backend (Terminal 2):" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "3. Start Frontend (Terminal 3):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "4. Open browser: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Happy hacking!" -ForegroundColor Magenta
