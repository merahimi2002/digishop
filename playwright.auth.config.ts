import { defineConfig, devices } from '@playwright/test';
const dev = process.env.PLAYWRIGHT_DEV === '1';
const port = dev ? 3500 : 3400;
const origin = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/auth-e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: origin,
    trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm ${dev ? 'dev' : 'start'} --hostname 127.0.0.1 --port ${port}`,
    url: `${origin}/fa/auth/sign-in`,
    reuseExistingServer: false,
    env: {
      NODE_ENV: dev ? 'development' : 'production',
      APP_ENV: 'test',
      AUTH_ENABLED: 'true',
      APP_ORIGIN: origin,
      AUTH_EMAIL_TRANSPORT: 'local',
      SHADOW_DATABASE_URL: '',
      OWNER_EMAIL: '',
    },
    timeout: 120000,
  },
});
