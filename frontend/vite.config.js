import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Barcha network interfacelar uchun
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
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
          // Vendor chunks - katta kutubxonalar
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-hot-toast') || id.includes('qrcode')) {
              return 'ui-vendor';
            }
            if (id.includes('react-i18next') || id.includes('i18next')) {
              return 'i18n-vendor';
            }
            if (id.includes('axios')) {
              return 'axios-vendor';
            }
            // Boshqa node_modules
            return 'vendor';
          }
          // Page chunks
          if (id.includes('/src/pages/Dashboard.jsx') || id.includes('/src/pages/DoctorPanel.jsx')) {
            return 'dashboard-pages';
          }
          if (id.includes('/src/pages/Patients.jsx') || id.includes('/src/pages/PatientProfile.jsx')) {
            return 'patient-pages';
          }
          if (id.includes('/src/pages/Queue') || id.includes('/src/pages/QueueManagement')) {
            return 'queue-pages';
          }
          if (id.includes('/src/pages/Cashier') || id.includes('/src/pages/Invoices')) {
            return 'billing-pages';
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
      'axios'
    ],
    // Force pre-bundling
    force: false
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
