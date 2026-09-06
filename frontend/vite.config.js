import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy Error:', err.message);
            console.error('Backend server is not running on port 5000');
            console.error('📝 Please start the backend server with: cd backend && npm start');
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log(`📤 Proxying ${req.method} ${req.url} to backend...`);
          });
          proxy.on('proxyRes', (_proxyRes, req, _res) => {
            console.log(`📥 Backend responded to ${req.method} ${req.url}`);
          });
        },
      },
    },
  },
});
