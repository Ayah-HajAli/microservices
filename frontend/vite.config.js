import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/auth':          { target: 'http://localhost:3001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/auth/, '') },
      '/api/products':      { target: 'http://localhost:3002', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/products/, '') },
      '/api/orders':        { target: 'http://localhost:3003', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/orders/, '') },
      '/api/notifications': { target: 'http://localhost:3004', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/notifications/, '') },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
