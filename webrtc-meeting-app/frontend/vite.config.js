import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for deployment
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    strictPort: true
    // allowedHosts removed to allow all connections on local network
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
