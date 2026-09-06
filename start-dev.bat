@echo off
REM Metal Mart Development Server Startup Script for Windows
REM This batch file starts both backend and frontend servers

setlocal enabledelayedexpansion

echo.
echo =====================================
echo 🚀 Metal Mart Development Environment
echo =====================================
echo.

set BACKEND_PORT=5000
set FRONTEND_PORT=5173

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed
echo.
echo 📦 Starting Backend Server (port %BACKEND_PORT%)...
echo 📝 A new window will open for the backend
echo.

REM Start backend in a new window
start "Metal Mart - Backend" cmd /k "cd backend && npm start"

REM Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak

echo.
echo ⚛️  Starting Frontend Server (port %FRONTEND_PORT%)...
echo 📝 A new window will open for the frontend
echo.

REM Start frontend in a new window
start "Metal Mart - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================
echo 🎉 Development Environment Started!
echo =====================================
echo.
echo Backend:  http://localhost:%BACKEND_PORT%/api/health
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo 📝 Both servers are running in separate windows above
echo 🛑 Close either window to stop that server
echo.
pause
