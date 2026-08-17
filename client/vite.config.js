import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // e2e/ is a Playwright suite, a different test runner with its own
    // *.spec.js convention - Vitest's default glob would otherwise also
    // try (and fail) to run it as a unit test.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      }
    }
  },
  // `vite preview` (serves the production build - what E2E tests run
  // against) does NOT inherit `server.proxy`; it needs its own identical
  // block or /api requests 404 against the static preview server.
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios']
        }
      }
    }
  }
})
