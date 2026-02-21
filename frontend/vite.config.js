import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Backend URL for proxy. If you see ECONNREFUSED, start the backend: cd backend && npm run dev
const backendUrl = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 3000,      // You can change 3000 to any port you want (e.g., 5174, 8080)
    host: 'localhost', // This often fixes the "Permission Denied" (EACCES) error
    strictPort: true,  // If true, Vite will quit if the port is already in use instead of trying the next one
    proxy: {
      // Proxy /api to backend. ECONNREFUSED = backend not running (start: cd backend && npm run dev)
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        // Long enough for last chunk request to stay open until MEGA upload + DB save complete
        timeout: 900000,      // 15 minutes
        proxyTimeout: 900000,
      },
    },
  },
})
