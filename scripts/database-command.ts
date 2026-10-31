import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import { spawnSync } from 'node:child_process';
import { validateEnvironment } from '../src/config/env-schema';
const mode = process.argv[2];
if (mode !== 'local' && mode !== 'test') throw new Error('Expected local or test environment');
if (mode === 'test') {
  Object.assign(process.env, { NODE_ENV: 'test' });
  process.env.APP_ENV = 'test';
}
loadEnvConfig(process.cwd(), mode !== 'test', { info: () => {}, error: () => {} });
const env = validateEnvironment(process.env);
if (mode === 'test' && (!env.DATABASE_URL || !new URL(env.DATABASE_URL).pathname.endsWith('_test')))
  throw new Error('Dedicated *_test database required');
const args = process.argv.slice(3);
const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], {
  stdio: 'inherit',
  env: process.env,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
