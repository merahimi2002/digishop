import 'server-only';
import { createDatabaseClient } from './factory';
import { serverEnv } from '../env';
const globalDatabase = globalThis as unknown as {
  database?: ReturnType<typeof createDatabaseClient>;
};
export function getDatabase() {
  if (!serverEnv.DATABASE_URL) throw new Error('DATABASE_URL is required for database operations');
  if (!globalDatabase.database)
    globalDatabase.database = createDatabaseClient(serverEnv.DATABASE_URL);
  return globalDatabase.database;
}
