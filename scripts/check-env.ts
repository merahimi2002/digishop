import { validateEnvironment } from '../src/config/env-schema';
import { existsSync } from 'node:fs';

const mode = process.env.NODE_ENV ?? 'development';
for (const filename of [
  `.env.${mode}.local`,
  ...(mode === 'test' ? [] : ['.env.local']),
  `.env.${mode}`,
  '.env',
]) {
  if (existsSync(filename)) process.loadEnvFile(filename);
}

validateEnvironment(process.env);
console.log(
  'Environment valid. Optional integrations remain disabled unless explicitly configured.',
);
