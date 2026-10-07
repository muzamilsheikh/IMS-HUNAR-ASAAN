import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-reload if a lazy chunk failed to load (e.g. after a new deployment with new file hashes)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('New deployment detected, reloading page to fetch latest version...');
  window.location.reload();
});

const rootElement = document.getElementById('root')

if (rootElement) {
  const root = createRoot(rootElement)
  root.render(<App />)
} else {
  console.error('FATAL: #root element not found in index.html!')
}