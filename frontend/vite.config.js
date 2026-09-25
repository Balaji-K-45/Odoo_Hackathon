import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // Must match the CORS whitelist on the Flask backend
    strictPort: true,  // Crash if 5173 is already in use (don't silently switch)
  },
})
