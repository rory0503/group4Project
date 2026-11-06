import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // sends any /api request from the React app to the FastAPI backend
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
})
