import { z } from 'zod';
export const emailInput = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const passwordInput = z.string().min(12).max(128);
export const nameInput = z.string().trim().min(2).max(160);
export const authModes = ['sign-in', 'sign-up', 'forgot', 'reset', 'verify', 'resend'] as const;
export type AuthMode = (typeof authModes)[number];
export function authFormSchema(mode: AuthMode) {
  return z
    .object({ name: z.string(), email: z.string(), password: z.string(), confirmation: z.string() })
    .superRefine((data, ctx) => {
      const check = (field: keyof typeof data, schema: z.ZodType) => {
        if (!schema.safeParse(data[field]).success)
          ctx.addIssue({ code: 'custom', path: [field], message: 'invalid' });
      };
      if (['sign-in', 'sign-up', 'forgot', 'resend'].includes(mode)) check('email', emailInput);
      if (mode === 'sign-up') check('name', nameInput);
      if (mode === 'sign-in') check('password', z.string().min(1).max(128));
      if (['sign-up', 'reset'].includes(mode)) {
        check('password', passwordInput);
        if (data.password !== data.confirmation)
          ctx.addIssue({ code: 'custom', path: ['confirmation'], message: 'mismatch' });
      }
    });
}
