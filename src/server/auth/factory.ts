import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import type { PrismaClient } from '../../generated/prisma/client';
import { siteConfig } from '../../config/generated/site';
import { makeMailSender, type AuthEnvironment, type AuthMail } from './mail';
import { tokenDigest } from './policy';
export function createAuth(
  db: PrismaClient,
  env: AuthEnvironment,
  send: (mail: AuthMail) => Promise<void> = makeMailSender(env),
) {
  if (!env.BETTER_AUTH_SECRET) throw new Error('Auth secret required');
  const localeOf = (request?: Request) =>
    request?.headers.get('x-digishop-locale') === 'en' ? 'en' : 'fa';
  return betterAuth({
    appName: siteConfig.brand.names.en,
    baseURL: env.APP_ORIGIN,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(db, { provider: 'postgresql', transaction: true }),
    trustedOrigins: [env.APP_ORIGIN],
    logger: { disabled: true },
    advanced: {
      database: { generateId: 'uuid' },
      trustedProxyHeaders: false,
      useSecureCookies: new URL(env.APP_ORIGIN).protocol === 'https:',
      ipAddress: { ipAddressHeaders: [] },
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', path: '/' },
    },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'CUSTOMER', input: false },
        disabled: { type: 'boolean', defaultValue: false, input: false },
        mustChangePassword: { type: 'boolean', defaultValue: false, input: false },
      },
    },
    session: {
      expiresIn: 86400,
      disableSessionRefresh: true,
      freshAge: 3600,
      cookieCache: { enabled: false },
    },
    verification: {
      storeIdentifier: { hash: async (value) => tokenDigest(value) },
      storeInDatabase: true,
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 200,
      customRules: {
        '/sign-in/email': { window: 60, max: 30 },
        '/sign-up/email': { window: 600, max: 20 },
        '/request-password-reset': { window: 600, max: 20 },
        '/send-verification-email': { window: 600, max: 20 },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }, request) => {
        const locale = localeOf(request);
        const url = `${env.APP_ORIGIN}/${locale}/auth/reset#token=${encodeURIComponent(token)}`;
        await send({
          to: user.email,
          kind: 'reset',
          url,
          subject: locale === 'fa' ? 'بازیابی رمز حساب' : 'Reset your password',
          text:
            locale === 'fa'
              ? `برای تغییر رمز حساب، لینک زیر را باز کن. اعتبار: ۳۰ دقیقه.\n${url}`
              : `Open this link to reset your password. Valid for 30 minutes.\n${url}`,
        });
      },
      onPasswordReset: async ({ user }) => {
        await db.$transaction([
          db.user.update({ where: { id: user.id }, data: { mustChangePassword: false } }),
          db.auditEvent.create({
            data: {
              actorId: user.id,
              action: 'auth.password.reset',
              entityType: 'User',
              entityId: user.id,
            },
          }),
        ]);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, token }, request) => {
        const locale = localeOf(request);
        const identifier = tokenDigest('email-verify:' + token);
        await db.verification.upsert({
          where: { identifier },
          update: { expiresAt: new Date(Date.now() + 3600000) },
          create: { identifier, value: user.id, expiresAt: new Date(Date.now() + 3600000) },
        });
        const url = `${env.APP_ORIGIN}/${locale}/auth/verify#token=${encodeURIComponent(token)}`;
        await send({
          to: user.email,
          kind: 'verify',
          url,
          subject: locale === 'fa' ? 'تأیید ایمیل حساب' : 'Verify your email',
          text:
            locale === 'fa'
              ? `برای تأیید ایمیل، لینک زیر را باز کن. اعتبار: یک ساعت.\n${url}`
              : `Open this link to verify your email. Valid for one hour.\n${url}`,
        });
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await db.user.findUnique({ where: { id: session.userId } });
            if (!user || user.disabled)
              throw new APIError('FORBIDDEN', { message: 'Account unavailable' });
            return { data: session };
          },
        },
      },
    },
  });
}
export type Auth = ReturnType<typeof createAuth>;
export async function readPrincipal(auth: Auth, db: PrismaClient, headers: Headers) {
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.disabled || !user.emailVerified) {
    await db.session.deleteMany({ where: { userId: session.user.id } });
    return null;
  }
  return { session: session.session, user };
}
export function safeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}
