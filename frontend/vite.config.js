import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/generate-guide': 'http://localhost:8000',
      '/download-pdf': 'http://localhost:8000',
      '/extract-pdf': 'http://localhost:8000',
    },
  },
})
