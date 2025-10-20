import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Generate gzip compressed files
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      deleteOriginFile: false,
    }),
    // Generate brotli compressed files (better compression than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  build: {
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for React and related libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            // Separate chunk for lucide-react icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Group all other node_modules into vendor chunk
            return 'vendor';
          }
          // Split modal/form components into separate chunks
          if (id.includes('/components/') && (
            id.includes('Modal') ||
            id.includes('Form')
          )) {
            return 'modals';
          }
        },
      },
    },
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable CSS minification (enabled by default in production)
    cssMinify: true,
    // Enable minification and tree-shaking with esbuild (faster than terser)
    minify: 'esbuild',
    // Improve source map generation
    sourcemap: false, // Disable source maps for smaller bundle size
    // Target modern browsers for better optimization
    target: 'es2015'
  },
}) 