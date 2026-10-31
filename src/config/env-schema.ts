import { z } from 'zod';

const optionalText = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.url().optional());
const flag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['local', 'test', 'preview', 'production']).default('local'),
    APP_ORIGIN: z.url().default('http://localhost:3000'),
    AUTH_ENABLED: flag,
    DEMO_SEED_ENABLED: flag,
    DATABASE_URL: optionalUrl,
    DIRECT_DATABASE_URL: optionalUrl,
    SHADOW_DATABASE_URL: optionalUrl,
    BETTER_AUTH_SECRET: optionalText,
    CONFIG_ENCRYPTION_KEY: optionalText,
    AI_ENABLED: flag,
    AI_API_KEY: optionalText,
    AI_BASE_URL: optionalUrl,
    AI_MODEL: optionalText,
  })
  .superRefine((env, context) => {
    const missing = (key: string) =>
      context.addIssue({ code: 'custom', path: [key], message: 'Required for enabled feature' });
    for (const key of ['DATABASE_URL', 'DIRECT_DATABASE_URL', 'SHADOW_DATABASE_URL'] as const) {
      const value = env[key];
      if (
        value &&
        URL.canParse(value) &&
        !['postgres:', 'postgresql:'].includes(new URL(value).protocol)
      )
        context.addIssue({ code: 'custom', path: [key], message: 'PostgreSQL URL required' });
      if (
        env.APP_ENV === 'test' &&
        value &&
        URL.canParse(value) &&
        !new URL(value).pathname.toLowerCase().endsWith('_test')
      )
        context.addIssue({
          code: 'custom',
          path: [key],
          message: 'Test database name must end with _test',
        });
    }
    if (
      env.SHADOW_DATABASE_URL &&
      [env.DATABASE_URL, env.DIRECT_DATABASE_URL].some(
        (value) =>
          value &&
          URL.canParse(value) &&
          URL.canParse(env.SHADOW_DATABASE_URL!) &&
          new URL(value).host === new URL(env.SHADOW_DATABASE_URL!).host &&
          new URL(value).pathname === new URL(env.SHADOW_DATABASE_URL!).pathname,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['SHADOW_DATABASE_URL'],
        message: 'Shadow database must be separate',
      });
    if (env.AUTH_ENABLED) {
      if (!env.DATABASE_URL) missing('DATABASE_URL');
      if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
        missing('BETTER_AUTH_SECRET');
    }
    if (env.AI_ENABLED) {
      if (!env.AI_API_KEY) missing('AI_API_KEY');
      if (!env.AI_MODEL) missing('AI_MODEL');
    }
    if (env.APP_ENV === 'production' && !env.APP_ORIGIN.startsWith('https://'))
      missing('APP_ORIGIN');
  });

export function validateEnvironment(input: Record<string, string | undefined>) {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    // Print field names/messages only, never raw environment values.
    throw new Error(
      `Environment validation failed: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
    );
  }
  return result.data;
}
