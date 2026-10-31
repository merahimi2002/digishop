import { beforeAll, afterAll, it, expect } from 'vitest';
import { randomUUID, randomBytes } from 'node:crypto';
import { validateEnvironment } from '../../src/config/env-schema';
import { createDatabaseClient } from '../../src/server/database/factory';
import { createAuth } from '../../src/server/auth/factory';
import { createAuthHandler, createAccountHandler } from '../../src/server/auth/http';
import { tokenDigest } from '../../src/server/auth/policy';
import type { AuthMail } from '../../src/server/auth/mail';
const db = createDatabaseClient(process.env.DATABASE_URL!);
const origin = 'http://localhost:3400';
const env = validateEnvironment({
  ...process.env,
  APP_ENV: 'test',
  APP_ORIGIN: origin,
  AUTH_ENABLED: 'true',
  BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
});
const mailbox: AuthMail[] = [];
const auth = createAuth(db, env, async (mail) => {
  mailbox.push(mail);
});
const handle = createAuthHandler(auth, db, env);
const account = createAccountHandler(auth, db, env);
const admin = createAccountHandler(auth, db, env, 'admin');
const sessions = createAccountHandler(auth, db, env, 'sessions');
const email = 'auth-' + randomUUID() + '@example.test';
let password = 'Fixture-only-long-passphrase-42';
let cookie = '';
let userId = '';
const extraUsers: string[] = [];
function request(
  path: string,
  body: unknown,
  cookies = '',
  originHeader = origin,
  method = 'POST',
) {
  return new Request(origin + path, {
    method,
    headers: {
      Origin: originHeader,
      'Content-Type': 'application/json',
      Cookie: cookies,
      'x-digishop-locale': 'fa',
    },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
}
async function post(path: string, body: unknown, cookies = '') {
  return handle(request('/api/auth/' + path, body, cookies));
}
const token = (mail: AuthMail) =>
  new URLSearchParams(new URL(mail.url).hash.slice(1)).get('token')!;
const cookies = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
beforeAll(async () => {
  await db.rateLimit.deleteMany();
});
afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: [userId, ...extraUsers].filter(Boolean) } } });
  await db.verification.deleteMany({ where: { value: userId } });
  await db.$disconnect();
});
it('registers an unverified customer with a hashed password and no returned bearer token', async () => {
  const response = await post('sign-up/email', {
    name: 'حساب آزمایشی',
    email,
    password,
    role: 'OWNER',
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  userId = user.id;
  expect(user.role).toBe('CUSTOMER');
  expect(user.emailVerified).toBe(false);
  const credential = await db.account.findFirstOrThrow({ where: { userId } });
  expect(credential.password).not.toBe(password);
  expect(credential.password!.length).toBeGreaterThan(64);
  expect(mailbox).toHaveLength(1);
  expect(mailbox[0]!.url).toContain('#token=');
});
it('rejects login before verification and consumes verification only once', async () => {
  expect((await post('sign-in/email', { email, password })).ok).toBe(false);
  const verification = token(mailbox[0]!);
  expect(
    (await db.verification.findMany({ where: { value: userId } })).every((row) =>
      /^[a-f0-9]{64}$/.test(row.identifier),
    ),
  ).toBe(true);
  expect((await post('verify-email', { token: verification })).status).toBe(200);
  expect((await post('verify-email', { token: verification })).status).toBe(400);
});
it('sets HttpOnly/SameSite cookies, returns no token and keeps account responses private', async () => {
  const response = await post('sign-in/email', { email, password });
  expect(response.status).toBe(200);
  cookie = cookies(response);
  expect(response.headers.get('set-cookie')).toMatch(/httponly/i);
  expect(response.headers.get('set-cookie')).toMatch(/samesite=lax/i);
  expect(await response.json()).toEqual({ ok: true });
  const profile = await account(request('/api/account', null, cookie, origin, 'GET'));
  expect(profile.headers.get('cache-control')).toContain('no-store');
  const result = await profile.json();
  expect(result.user.email).toBe(email);
  expect(JSON.stringify(result)).not.toContain('token');
  expect((await admin(request('/api/admin/access', null, cookie, origin, 'GET'))).status).toBe(403);
});
it('rejects cross-origin writes and unsupported native endpoints', async () => {
  expect(
    (await handle(request('/api/auth/sign-out', {}, cookie, 'https://attacker.test'))).status,
  ).toBe(403);
  expect((await handle(request('/api/auth/update-user', { role: 'OWNER' }, cookie))).status).toBe(
    404,
  );
  expect((await handle(new Request(origin + '/api/auth/verify-email?token=raw'))).status).toBe(404);
});
it('uses Secure cookies for an HTTPS origin', async () => {
  const secureEnv = { ...env, APP_ORIGIN: 'https://shop.example.test' };
  const secure = createAuthHandler(
    createAuth(db, secureEnv, async () => {}),
    db,
    secureEnv,
  );
  const response = await secure(
    new Request('https://shop.example.test/api/auth/sign-in/email', {
      method: 'POST',
      headers: { Origin: 'https://shop.example.test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get('set-cookie')).toMatch(/; secure/i);
});
it('keeps owner privileges server-side and requires a real initial password change', async () => {
  await db.user.update({
    where: { id: userId },
    data: { role: 'OWNER', mustChangePassword: true },
  });
  expect((await admin(request('/api/admin/access', null, cookie, origin, 'GET'))).status).toBe(403);
  expect(
    (await post('change-password', { currentPassword: password, newPassword: password }, cookie))
      .status,
  ).toBe(400);
  const next = password + '-owner';
  const changed = await post(
    'change-password',
    { currentPassword: password, newPassword: next },
    cookie,
  );
  expect(changed.status).toBe(200);
  password = next;
  cookie = cookies(changed) || cookie;
  expect((await admin(request('/api/admin/access', null, cookie, origin, 'GET'))).status).toBe(200);
  await db.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' } });
  expect((await admin(request('/api/admin/access', null, cookie, origin, 'GET'))).status).toBe(403);
});
it('prevents session ownership violations and clears the session after logout', async () => {
  const other = await db.user.create({
    data: {
      email: 'other-' + randomUUID() + '@example.test',
      name: 'Fixture',
      emailVerified: true,
    },
  });
  extraUsers.push(other.id);
  const foreign = await db.session.create({
    data: {
      userId: other.id,
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  expect(
    (await sessions(request('/api/account/sessions', { id: foreign.id }, cookie, origin, 'DELETE')))
      .status,
  ).toBe(404);
  expect(await db.session.findUnique({ where: { id: foreign.id } })).not.toBeNull();

  const response = await sessions(
    request('/api/account/sessions', { id: randomUUID() }, cookie, origin, 'DELETE'),
  );
  expect(response.status).toBe(404);
  expect((await post('sign-out', {}, cookie)).status).toBe(200);
  const profile = await account(request('/api/account', null, cookie, origin, 'GET'));
  expect((await profile.json()).user).toBeNull();
});
it('spends password reset once, changes the password and revokes existing sessions', async () => {
  const signed = await post('sign-in/email', { email, password });
  cookie = cookies(signed);
  expect((await post('request-password-reset', { email })).status).toBe(200);
  const mail = mailbox.findLast((message) => message.kind === 'reset')!;
  const reset = token(mail);
  const record = await db.verification.findFirstOrThrow({
    where: { identifier: { not: '' }, value: userId },
  });
  expect(record.identifier).not.toContain(reset);
  expect(
    (await post('reset-password', { token: reset, newPassword: password + '-new' })).status,
  ).toBe(200);
  expect((await post('reset-password', { token: reset, newPassword: password })).status).toBe(400);
  expect(
    (await account(request('/api/account', null, cookie, origin, 'GET')).then((r) => r.json()))
      .user,
  ).toBeNull();
  expect((await post('sign-in/email', { email, password })).ok).toBe(false);
  const next = await post('sign-in/email', { email, password: password + '-new' });
  expect(next.status).toBe(200);
  cookie = cookies(next);
});
it('invalidates disabled accounts immediately', async () => {
  await db.user.update({ where: { id: userId }, data: { disabled: true } });
  expect(
    (await account(request('/api/account', null, cookie, origin, 'GET')).then((r) => r.json()))
      .user,
  ).toBeNull();
  await expect(
    auth.api.signInEmail({ body: { email, password: password + '-new' } }),
  ).rejects.toMatchObject({ status: 'FORBIDDEN' });
});
it('rate limits a normalized identity persistently even with forged IP headers', async () => {
  let limited = false;
  for (let i = 0; i < 8; i++) {
    const req = request('/api/auth/sign-in/email', { email: 'missing-' + email, password });
    req.headers.set('x-forwarded-for', '203.0.113.' + i);
    const response = await handle(req);
    if (response.status === 429) limited = true;
  }
  expect(limited).toBe(true);
});

it('rejects expired and wrong-purpose reset tokens', async () => {
  await post('request-password-reset', { email });
  const mail = mailbox.findLast((item) => item.kind === 'reset')!;
  const reset = token(mail);
  const record = await db.verification.findUniqueOrThrow({
    where: { identifier: tokenDigest('reset-password:' + reset) },
  });
  expect(record.expiresAt.getTime()).toBeGreaterThan(Date.now());
  await db.verification.updateMany({
    where: { id: record.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  expect((await post('reset-password', { token: reset, newPassword: password })).status).toBe(400);
  expect(
    (await post('reset-password', { token: token(mailbox[0]!), newPassword: password })).status,
  ).toBe(400);
});

it('keeps duplicate signup and unknown recovery responses generic', async () => {
  const duplicate = await post('sign-up/email', { name: 'Fixture', email, password });
  const unknown = await post('request-password-reset', {
    email: 'unknown-' + randomUUID() + '@example.test',
  });
  const existing = await post('request-password-reset', { email });
  expect(duplicate.status).toBe(200);
  expect(unknown.status).toBe(existing.status);
  expect(await unknown.json()).toEqual(await existing.json());
});
