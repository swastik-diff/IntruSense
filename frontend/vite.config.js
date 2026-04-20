import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://intrusense-production-fc94.up.railway.app',
      '/socket.io': {
        target: 'https://intrusense-production-fc94.up.railway.app',
        ws: true,
      },
    },
  },
})
