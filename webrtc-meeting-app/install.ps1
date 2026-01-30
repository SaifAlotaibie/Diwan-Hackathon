# WebRTC Meeting App - Installation Script

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 WebRTC Meeting App - Installation     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "   Download from: https://python.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check Ollama
try {
    $ollamaCheck = ollama list 2>&1
    Write-Host "✅ Ollama: Installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama not found!" -ForegroundColor Red
    Write-Host "   Download from: https://ollama.ai/download" -ForegroundColor Yellow
    $allGood = $false
}

if (-not $allGood) {
    Write-Host ""
    Write-Host "Please install missing prerequisites and run this script again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Installing Python packages..." -ForegroundColor Yellow
pip install faster-whisper --quiet

Write-Host ""
Write-Host "Step 3: Pulling Ollama model..." -ForegroundColor Yellow
ollama pull llama2

Write-Host ""
Write-Host "Step 4: Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install

Write-Host ""
Write-Host "Step 5: Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install

Set-Location ..

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Installation Complete!                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Run the app with:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal 1: ollama serve" -ForegroundColor White
Write-Host "  Terminal 2: cd backend && npm start" -ForegroundColor White
Write-Host "  Terminal 3: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or see QUICK_START.md for more options" -ForegroundColor Yellow
Write-Host ""
