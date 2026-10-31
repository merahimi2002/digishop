import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
export function createDatabaseClient(connectionString: string) {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      options: '-c timezone=UTC',
    }),
    log: [],
  });
}
export function loadDatabaseEnvironment() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', {
    info: () => {},
    error: () => {},
  });
}
