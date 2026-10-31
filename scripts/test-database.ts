import { spawnSync } from 'node:child_process';
import { loadDatabaseEnvironment } from '../src/server/database/factory';
import { validateEnvironment } from '../src/config/env-schema';
import { grantApplicationAccess } from './database-provision-test';
Object.assign(process.env, { NODE_ENV: 'test', APP_ENV: 'test' });
loadDatabaseEnvironment();
const env = validateEnvironment(process.env);
if (!env.DATABASE_URL || !env.DIRECT_DATABASE_URL)
  throw new Error('Integration tests require dedicated app and owner test URLs');
for (const value of [env.DATABASE_URL, env.DIRECT_DATABASE_URL])
  if (!new URL(value).pathname.endsWith('_test'))
    throw new Error('Refusing integration test on a non-test database');
const appTarget = new URL(env.DATABASE_URL),
  ownerTarget = new URL(env.DIRECT_DATABASE_URL);
if (
  appTarget.host !== ownerTarget.host ||
  appTarget.pathname !== ownerTarget.pathname ||
  appTarget.username === ownerTarget.username
)
  throw new Error('Test app/owner must be separate roles on the same dedicated database');
const migration = spawnSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  { env: process.env, stdio: 'inherit' },
);
if (migration.status !== 0) process.exit(migration.status ?? 1);
await grantApplicationAccess();
const tests = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.integration.config.ts'],
  { env: process.env, stdio: 'inherit' },
);
process.exitCode = tests.status ?? 1;
