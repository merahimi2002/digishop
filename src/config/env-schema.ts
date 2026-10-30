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
    DATABASE_URL: optionalUrl,
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
    if (
      env.APP_ENV === 'test' &&
      env.DATABASE_URL &&
      !new URL(env.DATABASE_URL).pathname.toLowerCase().includes('test')
    )
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'Test database name must explicitly contain test',
      });
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
