import { loadDatabaseEnvironment } from '../src/server/database/factory';
import { validateEnvironment } from '../src/config/env-schema';
import pg from 'pg';
export async function grantApplicationAccess() {
  const env = validateEnvironment(process.env);
  if (env.APP_ENV !== 'test' || !env.DATABASE_URL || !env.DIRECT_DATABASE_URL)
    throw new Error('Dedicated test app and owner URLs required');
  const app = new URL(env.DATABASE_URL),
    owner = new URL(env.DIRECT_DATABASE_URL);
  if (app.pathname !== owner.pathname || app.host !== owner.host || !app.pathname.endsWith('_test'))
    throw new Error('App and owner must address the same *_test database');
  if (app.username === owner.username)
    throw new Error('Integration tests require a non-owner application role');
  const db = new pg.Client({ connectionString: env.DIRECT_DATABASE_URL });
  await db.connect();
  try {
    const role = decodeURIComponent(app.username),
      password = decodeURIComponent(app.password);
    const exists = await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role]);
    if (!exists.rowCount) {
      const sql = await db.query<{ sql: string }>(
        `SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',$1::text,$2::text) AS sql`,
        [role, password],
      );
      await db.query(sql.rows[0]!.sql);
    }
    const identifier = pg.escapeIdentifier(role);
    await db.query('GRANT USAGE ON SCHEMA public TO ' + identifier);
    await db.query(
      'GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO ' + identifier,
    );
    await db.query('REVOKE ALL ON TABLE "_prisma_migrations" FROM ' + identifier);
    await db.query('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO ' + identifier);
  } finally {
    await db.end();
  }
}
if (process.argv[1]?.endsWith('database-provision-test.ts')) {
  loadDatabaseEnvironment();
  await grantApplicationAccess();
}
