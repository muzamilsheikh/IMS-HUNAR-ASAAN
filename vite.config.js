import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
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
      output: {
        manualChunks(id) {
          // Core React runtime — smallest, loads first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Animation — framer-motion is ~300KB, split for better caching
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          // Charts — recharts + recharts deps
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }
          // PDF generation — jspdf + html-to-image + react-pdf are heavy
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html-to-image') || id.includes('node_modules/@react-pdf')) {
            return 'vendor-pdf';
          }
          // Socket.io client
          if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
            return 'vendor-socket';
          }
          // Remaining node_modules in a shared vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        }
      }
    }
  }
})

