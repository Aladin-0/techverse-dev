import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  esbuild: {
    drop: ['console', 'debugger'],
    target: 'esnext',
  },

  server: {
    host: '0.0.0.0',
    allowedHosts: 'all',
    port: 5173,
    proxy: {
      '/api': { target: 'http://backend:8000', changeOrigin: true },
      '/admin': { target: 'http://backend:8000', changeOrigin: true },
      '/admin-panel': { target: 'http://backend:8000', changeOrigin: true },
      '/auth': { target: 'http://backend:8000', changeOrigin: true },
      '/accounts': { target: 'http://backend:8000', changeOrigin: true },
      '/media': { target: 'http://backend:8000', changeOrigin: true },
      '/static': { target: 'http://backend:8000', changeOrigin: true },
    },
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    // Inline assets < 8KB as base64 to eliminate tiny HTTP round-trips
    assetsInlineLimit: 8192,
    chunkSizeWarningLimit: 1500,
    // Sourcemaps off for production — smaller output
    sourcemap: false,
  }
})