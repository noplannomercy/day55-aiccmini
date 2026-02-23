import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration.
 *
 * Uses port 3099 so this project's test server never collides with other
 * Next.js dev servers that may already occupy ports 3000-3002.
 *
 * Projects:
 * - setup: runs auth.setup.ts once to authenticate and save cookies
 * - chromium: runs all spec files with the saved auth state
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3099',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev -- -p 3099',
    url: 'http://localhost:3099',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
