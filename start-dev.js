#!/usr/bin/env node

/**
 * Development startup script for Metal Mart
 * Starts both backend and frontend servers
 * Usage: npm run dev (from root directory)
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const BACKEND_PORT = process.env.PORT || 5000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;

// Check if backend is running
const checkBackendHealth = () => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
      resolve(res.statusCode === 200);
      res.resume(); // Consume response data
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000);
  });
};

const startBackend = () => {
  console.log(`\n📦 Starting Backend Server on port ${BACKEND_PORT}...`);
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
  });

  backend.on('error', (err) => {
    console.error('❌ Failed to start backend:', err);
    process.exit(1);
  });

  return backend;
};

const startFrontend = () => {
  console.log(`\n⚛️  Starting Frontend Server on port ${FRONTEND_PORT}...`);
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
  });

  frontend.on('error', (err) => {
    console.error('❌ Failed to start frontend:', err);
    process.exit(1);
  });

  return frontend;
};

const main = async () => {
  console.log('🚀 Metal Mart Development Environment');
  console.log('=====================================\n');

  // Check if backend is already running
  const backendRunning = await checkBackendHealth();
  
  if (!backendRunning) {
    console.log('⏳ Backend is not running. Starting it now...');
    startBackend();
    
    // Wait for backend to start
    console.log('⏳ Waiting for backend to start (up to 10 seconds)...');
    for (let i = 0; i < 20; i++) {
      const health = await checkBackendHealth();
      if (health) {
        console.log('✅ Backend is ready!\n');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } else {
    console.log('✅ Backend is already running on port ' + BACKEND_PORT + '\n');
  }

  // Start frontend
  startFrontend();

  console.log('\n=====================================');
  console.log('🎉 Development Environment Ready!');
  console.log(`Frontend: http://localhost:${FRONTEND_PORT}`);
  console.log(`Backend API: http://localhost:${BACKEND_PORT}/api`);
  console.log('=====================================\n');

  // Keep process alive so child processes stay active
  await new Promise(() => {});
};

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
