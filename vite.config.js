import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // All /api/* requests from the frontend are proxied to the backend on port 5001.
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    exclude: ['bcrypt', 'sequelize', 'mysql2', 'express', 'cors', 'socket.io', 'jsonwebtoken', 'dotenv'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
    chunkSizeWarningLimit: 2000,
  }
})
