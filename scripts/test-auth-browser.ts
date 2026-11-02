import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { loadDatabaseEnvironment } from '../src/server/database/factory';
import { validateEnvironment } from '../src/config/env-schema';
Object.assign(process.env, { NODE_ENV: 'test', APP_ENV: 'test' });
loadDatabaseEnvironment();
Object.assign(process.env, {
  AUTH_ENABLED: 'true',
  AUTH_EMAIL_TRANSPORT: 'local',
  BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
  APP_ORIGIN: `http://127.0.0.1:${process.argv.includes('--dev') ? 3500 : 3400}`,
  PLAYWRIGHT_DEV: process.argv.includes('--dev') ? '1' : '0',
  SHADOW_DATABASE_URL: '',
  OWNER_EMAIL: '',
});
const env = validateEnvironment(process.env);
if (!env.DATABASE_URL || !new URL(env.DATABASE_URL).pathname.endsWith('_test'))
  throw new Error('Dedicated test database required');
const result = spawnSync(
  process.execPath,
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    '--config=playwright.auth.config.ts',
    '--workers=1',
    ...process.argv.slice(2).filter((argument) => argument !== '--dev'),
  ],
  { env: process.env, stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
