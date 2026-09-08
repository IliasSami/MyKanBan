import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/ai-convert': {
        target: 'https://router.bynara.id/v1/chat/completions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai-convert/, '')
      }
    }
  }
})
