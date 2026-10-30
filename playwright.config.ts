import { defineConfig, devices } from '@playwright/test';

const dev = process.env.PLAYWRIGHT_DEV === '1';
const port = dev ? 3100 : 3200;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: dev
      ? `pnpm dev --hostname 127.0.0.1 --port ${port}`
      : `pnpm start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/fa`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
