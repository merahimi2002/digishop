import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import type { Auth } from './factory';
import { readPrincipal, safeUser } from './factory';
import { emailInput, passwordInput, nameInput, tokenInput, tokenDigest, can } from './policy';
import type { AuthEnvironment } from './mail';
export function privateJson(body: unknown, status = 200, headers?: Headers) {
  const next = new Headers(headers);
  next.delete('content-length');
  next.delete('location');
  next.set('Cache-Control', 'private, no-store, max-age=0');
  next.set('Pragma', 'no-cache');
  next.set('Referrer-Policy', 'no-referrer');
  return Response.json(body, { status, headers: next });
}
export async function bodyJson(request: Request, maxBytes = 8192) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
    throw new Error('JSON required');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Body required');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('Body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}
export function sameOrigin(request: Request, origin: string) {
  return (
    request.headers.get('origin') === origin &&
    request.headers.get('sec-fetch-site') !== 'cross-site'
  );
}
export async function consumeLimit(
  db: PrismaClient,
  key: string,
  max: number,
  windowSeconds: number,
) {
  const now = BigInt(Date.now()),
    cutoff = now - BigInt(windowSeconds * 1000);
  const rows = await db.$queryRaw<{ count: number; lastRequest: bigint }[]>`
 INSERT INTO "RateLimit" (id,key,count,"lastRequest") VALUES (gen_random_uuid(),${tokenDigest(key)},1,${now})
 ON CONFLICT(key) DO UPDATE SET count=CASE WHEN "RateLimit"."lastRequest"<=${cutoff} THEN 1 ELSE LEAST("RateLimit".count+1,${max + 1}) END,
 "lastRequest"=CASE WHEN "RateLimit"."lastRequest"<=${cutoff} THEN ${now} ELSE "RateLimit"."lastRequest" END RETURNING count,"lastRequest"`;
  return rows[0]!.count <= max;
}
const inputs = {
  'sign-up/email': z.object({ name: nameInput, email: emailInput, password: passwordInput }),
  'sign-in/email': z.object({ email: emailInput, password: z.string().min(1).max(128) }),
  'request-password-reset': z.object({ email: emailInput }),
  'send-verification-email': z.object({ email: emailInput }),
  'reset-password': z.object({ token: tokenInput, newPassword: passwordInput }),
  'change-password': z
    .object({
      currentPassword: z.string().min(1).max(128),
      newPassword: passwordInput,
    })
    .refine((data) => data.currentPassword !== data.newPassword),
  'verify-email': z.object({ token: tokenInput }),
  'sign-out': z.object({}),
  'revoke-other-sessions': z.object({}),
};
export function createAuthHandler(auth: Auth, db: PrismaClient, env: AuthEnvironment) {
  return async (request: Request) => {
    const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, '');
    if (request.method !== 'POST' || !Object.hasOwn(inputs, path))
      return privateJson({ error: 'NOT_FOUND' }, 404);
    if (!sameOrigin(request, env.APP_ORIGIN)) return privateJson({ error: 'FORBIDDEN' }, 403);
    try {
      const parsed = inputs[path as keyof typeof inputs].safeParse(await bodyJson(request));
      if (!parsed.success) return privateJson({ error: 'INVALID_INPUT' }, 400);
      const data = parsed.data;
      if (!(await consumeLimit(db, 'global:' + path, 200, 60)))
        return privateJson({ error: 'RATE_LIMITED' }, 429, new Headers({ 'Retry-After': '60' }));
      if ('email' in data && !(await consumeLimit(db, path + ':' + data.email, 6, 60)))
        return privateJson({ error: 'RATE_LIMITED' }, 429, new Headers({ 'Retry-After': '60' }));
      if (path === 'verify-email' && 'token' in data) {
        const consumed = await db.verification.deleteMany({
          where: {
            identifier: tokenDigest('email-verify:' + data.token),
            expiresAt: { gt: new Date() },
          },
        });
        if (consumed.count !== 1) return privateJson({ error: 'INVALID_TOKEN' }, 400);
        await auth.api.verifyEmail({ query: { token: data.token } });
        return privateJson({ ok: true });
      }
      let principal: Awaited<ReturnType<typeof readPrincipal>> = null;
      if (['change-password', 'revoke-other-sessions'].includes(path)) {
        principal = await readPrincipal(auth, db, request.headers);
        if (!principal) return privateJson({ error: 'UNAUTHORIZED' }, 401);
      }
      const body = {
        ...data,
        ...(path === 'change-password' ? { revokeOtherSessions: true } : {}),
      };
      const forwarded = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body),
      });
      const response = await auth.handler(forwarded);
      if (!response.ok)
        return privateJson(
          { error: response.status === 429 ? 'RATE_LIMITED' : 'AUTH_FAILED' },
          response.status >= 500 ? 503 : response.status,
          response.headers,
        );
      if (principal && path === 'change-password')
        await db.$transaction([
          db.user.update({ where: { id: principal.user.id }, data: { mustChangePassword: false } }),
          db.auditEvent.create({
            data: {
              actorId: principal.user.id,
              action: 'auth.password.changed',
              entityType: 'User',
              entityId: principal.user.id,
            },
          }),
        ]);
      return privateJson({ ok: true }, 200, response.headers);
    } catch {
      return privateJson({ error: 'AUTH_FAILED' }, 400);
    }
  };
}
export function createAccountHandler(
  auth: Auth,
  db: PrismaClient,
  env: AuthEnvironment,
  kind: 'account' | 'sessions' | 'admin' = 'account',
) {
  return async (request: Request) => {
    if (request.method !== 'GET' && !sameOrigin(request, env.APP_ORIGIN))
      return privateJson({ error: 'FORBIDDEN' }, 403);
    const principal = await readPrincipal(auth, db, request.headers);
    if (!principal)
      return privateJson(
        { user: null },
        kind === 'account' && request.method === 'GET' ? 200 : 401,
      );
    const { user, session } = principal;
    if (kind === 'admin')
      return can(user.role, 'catalog:write') && !user.mustChangePassword
        ? privateJson({ role: user.role })
        : privateJson({ error: 'FORBIDDEN' }, 403);
    if (request.method === 'PATCH' && kind === 'account') {
      try {
        const { name } = z.object({ name: nameInput }).parse(await bodyJson(request));
        await db.$transaction([
          db.user.update({ where: { id: user.id }, data: { name } }),
          db.auditEvent.create({
            data: {
              actorId: user.id,
              action: 'auth.profile.updated',
              entityType: 'User',
              entityId: user.id,
            },
          }),
        ]);
        return privateJson({ ok: true });
      } catch {
        return privateJson({ error: 'INVALID_INPUT' }, 400);
      }
    }
    if (request.method === 'DELETE' && kind === 'sessions') {
      try {
        const { id } = z.object({ id: z.uuid() }).parse(await bodyJson(request));
        const deleted = await db.session.deleteMany({ where: { id, userId: user.id } });
        return privateJson({ ok: deleted.count === 1 }, deleted.count ? 200 : 404);
      } catch {
        return privateJson({ error: 'INVALID_INPUT' }, 400);
      }
    }
    if (request.method !== 'GET') return privateJson({ error: 'NOT_FOUND' }, 404);
    const sessions = await db.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, expiresAt: true },
    });
    return privateJson({
      user: safeUser(user),
      sessions: sessions.map((item) => ({ ...item, current: item.id === session.id })),
      expiresAt: session.expiresAt,
    });
  };
}
