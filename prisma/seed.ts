import { createDatabaseClient, loadDatabaseEnvironment } from '../src/server/database/factory';
import { validateEnvironment } from '../src/config/env-schema';
import { seedDemo } from './demo';
loadDatabaseEnvironment();
const env = validateEnvironment(process.env);
if (!['local', 'test'].includes(env.APP_ENV) || !env.DEMO_SEED_ENABLED)
  throw new Error('Demo seed requires local/test APP_ENV and DEMO_SEED_ENABLED=true');
if (!env.DATABASE_URL) throw new Error('DATABASE_URL required');
const db = createDatabaseClient(env.DATABASE_URL);
try {
  const result = await seedDemo(db);
  console.log(
    `Draft demo seed ready: ${result.products} products, ${result.variants} variants. No user accounts created.`,
  );
} finally {
  await db.$disconnect();
}
