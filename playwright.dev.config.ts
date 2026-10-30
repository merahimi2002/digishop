import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: 'http://127.0.0.1:3100' },
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1 --port 3100',
    env: { PLAYWRIGHT_DEV: '1', NEXT_TELEMETRY_DISABLED: '1' },
    url: 'http://127.0.0.1:3100/fa',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
