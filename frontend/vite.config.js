import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://YOUR-APP.up.railway.app',
      '/socket.io': {
        target: 'https://YOUR-APP.up.railway.app',
        ws: true,
      },
    },
  },
})