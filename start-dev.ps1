# Metal Mart Development Server Startup Script for PowerShell
# Usage: .\start-dev.ps1

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🚀 Metal Mart Development Environment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$BACKEND_PORT = 5000
$FRONTEND_PORT = 5173

# Check if Node.js is installed
try {
    $node = Get-Command node -ErrorAction Stop
    Write-Host "✅ Node.js found: $($node.Path)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npm = Get-Command npm -ErrorAction Stop
    Write-Host "✅ npm found" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Starting Backend Server (port $BACKEND_PORT)..." -ForegroundColor Cyan
Write-Host "📝 A new window will open for the backend" -ForegroundColor Yellow
Write-Host ""

# Start backend in a new PowerShell window
$backend = Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -WindowStyle Normal -PassThru

# Wait for backend to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "⚛️  Starting Frontend Server (port $FRONTEND_PORT)..." -ForegroundColor Cyan
Write-Host "📝 A new window will open for the frontend" -ForegroundColor Yellow
Write-Host ""

# Start frontend in a new PowerShell window
$frontend = Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal -PassThru

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "🎉 Development Environment Started!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:$BACKEND_PORT/api/health" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:$FRONTEND_PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Both servers are running in separate windows" -ForegroundColor Yellow
Write-Host "🛑 Close either window to stop that server" -ForegroundColor Yellow
Write-Host ""

# Keep this window open
Read-Host "Press Enter to continue"
