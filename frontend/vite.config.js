import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
    // PWA disabled to avoid caching issues
  ],
  server: {
    port: 3000,
    host: true, // Barcha network interfacelar uchun
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    },
    // HMR sozlamalari
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      port: 3000
    },
    // File watcher sozlamalari
    watch: {
      usePolling: true, // Windows uchun muhim
      interval: 100
    }
  },
  build: {
    // Chunk size optimization
    chunkSizeWarningLimit: 1000,
    // Tezroq build
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React only
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/') || id.includes('/react-is/') || id.includes('/scheduler/')) {
              return 'react-vendor'
            }
            if (id.includes('/axios/')) return 'axios-vendor'
            if (id.includes('/i18next/') || id.includes('/react-i18next/')) return 'i18n-vendor'
          }
        },
      },
    },
    // Minification
    minify: 'esbuild', // esbuild tezroq
    // Source maps faqat development da
    sourcemap: false,
  },
  // Optimize dependencies - tezroq yuklash
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'react-hot-toast',
      'axios',
      'react-is',
      'chart.js',
      'react-chartjs-2'
    ],
    // Force pre-bundling
    force: true
  },
  // Resolve aliases - tezroq import
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils'
    }
  }
})
