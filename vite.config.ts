import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Separate chunk for lucide-react icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
}) 