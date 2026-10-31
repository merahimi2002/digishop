import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { loadDatabaseEnvironment, createDatabaseClient } from '../src/server/database/factory';
import { validateEnvironment } from '../src/config/env-schema';
import { createAuth } from '../src/server/auth/factory';
loadDatabaseEnvironment();
const env = validateEnvironment(process.env);
if (!env.AUTH_ENABLED || !env.OWNER_EMAIL || !env.DATABASE_URL)
  throw new Error('AUTH_ENABLED, OWNER_EMAIL and DATABASE_URL required');
const email = env.OWNER_EMAIL.trim().toLowerCase();
const db = createDatabaseClient(env.DATABASE_URL);
try {
  let user = await db.user.findUnique({ where: { email } });
  if (user?.role === 'OWNER') {
    console.log('Owner is already provisioned. No password was reset.');
  } else {
    if (!user) {
      if (env.APP_ENV !== 'local')
        throw new Error(
          'Outside local development, register and verify the account before CLI promotion',
        );
      const password = randomBytes(24).toString('base64url');
      await createAuth(db, env).api.signUpEmail({ body: { email, name: 'Owner', password } });
      user = await db.user.findUniqueOrThrow({ where: { email } });
      await writeFile(
        '.tools/owner-credentials.json',
        JSON.stringify({ email, password, verificationRequired: true }, null, 2),
        { mode: 0o600, flag: 'wx' },
      );
    } else if (!user.emailVerified)
      throw new Error('Verify the existing account before owner promotion');
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { role: 'OWNER', mustChangePassword: true } }),
      db.auditEvent.create({
        data: {
          actorId: user.id,
          action: 'auth.owner.bootstrap',
          entityType: 'User',
          entityId: user.id,
        },
      }),
    ]);
    console.log(
      'Owner provisioned. Local credential file and mailbox are ignored by Git. Verification and an initial password change are required.',
    );
  }
} finally {
  await db.$disconnect();
}
