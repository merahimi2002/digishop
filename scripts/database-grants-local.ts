import pg from 'pg';
import { loadDatabaseEnvironment } from '../src/server/database/factory';
import { validateEnvironment } from '../src/config/env-schema';
loadDatabaseEnvironment();
const env = validateEnvironment(process.env);
if (env.APP_ENV !== 'local' || !env.DATABASE_URL || !env.DIRECT_DATABASE_URL)
  throw new Error('Local app and owner URLs required');
const app = new URL(env.DATABASE_URL),
  owner = new URL(env.DIRECT_DATABASE_URL);
if (app.host !== owner.host || app.pathname !== owner.pathname || app.username === owner.username)
  throw new Error('Local roles must be distinct on the same database');
const client = new pg.Client({ connectionString: env.DIRECT_DATABASE_URL });
await client.connect();
try {
  const role = pg.escapeIdentifier(decodeURIComponent(app.username));
  await client.query('GRANT USAGE ON SCHEMA public TO ' + role);
  await client.query('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO ' + role);
  await client.query('REVOKE ALL ON TABLE "_prisma_migrations" FROM ' + role);
  await client.query('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO ' + role);
  console.log('Local app grants ready; migration history remains owner-only.');
} finally {
  await client.end();
}
