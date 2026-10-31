import { defineConfig } from 'prisma/config';
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', {
  info: () => {},
  error: () => {},
});
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: {
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
    url:
      process.env.DIRECT_DATABASE_URL ||
      process.env.DATABASE_URL ||
      'postgresql://127.0.0.1:55432/digishop',
  },
});
