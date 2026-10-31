import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Client } from 'pg';
const credentials = JSON.parse(readFileSync('.tools/local-db.json', 'utf8')) as Record<
  'admin' | 'owner' | 'app',
  string
>;
const admin = new Client({
  host: '127.0.0.1',
  port: 55432,
  user: 'digishop_admin',
  password: credentials.admin,
  database: 'postgres',
});
await admin.connect();
try {
  for (const [name, key] of [
    ['digishop_owner', 'owner'],
    ['digishop_app', 'app'],
  ] as const) {
    const exists = await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [name]);
    if (!exists.rowCount)
      await admin.query(
        `CREATE ROLE ${name} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${credentials[key]}'`,
      );
  }
  for (const database of ['digishop', 'digishop_test', 'digishop_shadow']) {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [database]);
    if (!exists.rowCount) await admin.query(`CREATE DATABASE ${database} OWNER digishop_owner`);
    await admin.query(`ALTER DATABASE ${database} SET timezone TO 'UTC'`);
  }
  for (const [file, database, appEnv] of [
    ['.env.local', 'digishop', 'local'],
    ['.env.test.local', 'digishop_test', 'test'],
  ] as const) {
    let content = existsSync(file) ? readFileSync(file, 'utf8') : '';
    for (const [key, value] of Object.entries({
      APP_ENV: appEnv,
      ...(appEnv === 'local'
        ? {
            SHADOW_DATABASE_URL: `postgresql://digishop_owner:${credentials.owner}@127.0.0.1:55432/digishop_shadow`,
          }
        : {}),
      DATABASE_URL: `postgresql://digishop_app:${credentials.app}@127.0.0.1:55432/${database}`,
      DIRECT_DATABASE_URL: `postgresql://digishop_owner:${credentials.owner}@127.0.0.1:55432/${database}`,
    })) {
      const previous = content.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1];
      if (previous && previous.trim() !== value)
        throw new Error(`${file}: existing database configuration preserved; configure manually`);
      content = content.replace(new RegExp(`^${key}=.*\\r?\\n?`, 'gm'), '');
      content += `\n${key}=${value}\n`;
    }
    writeFileSync(file, content);
  }
  console.log(
    'Local roles/databases ready; generated credentials written to ignored environment files.',
  );
} finally {
  await admin.end();
}
