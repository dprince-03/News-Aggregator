import { defineConfig, devices } from '@playwright/test';

// Runs against `vite preview` (the production build) proxying to a real
// server + database - see package.json's `test:e2e` script and
// .github/workflows/ci.yml's `e2e` job for how the backend/DB get started.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // tests share one seeded DB - see e2e/critical-path.spec.js
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
