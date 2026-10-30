import { z } from 'zod';

const text = z.string().trim().min(1);
const pending = text.nullable();
const color = z.string().regex(/^#[\da-f]{6}$/i);
const palette = z.strictObject({ base: color, accent: color });
const localeCode = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);
const localeRecord = z.record(localeCode, pending);

export const businessSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    brand: z.strictObject({
      key: z.string().regex(/^[a-z][a-z0-9-]*$/),
      names: z.record(localeCode, text),
      legalName: pending,
      taglines: localeRecord,
      descriptions: localeRecord,
      domain: z.url().nullable(),
      logoLightPath: text,
      logoDarkPath: text,
      faviconPath: pending,
      socialImagePath: pending,
    }),
    business: z.strictObject({
      model: z.literal('single-vendor'),
      productType: z.literal('physical'),
      initialCategory: text,
      targetCountry: z.string().length(2),
      timezone: text.refine((value) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, 'Invalid IANA timezone'),
      sellerAddress: pending,
      postalCode: pending,
      taxIdentifier: pending,
    }),
    contact: z.strictObject({
      supportEmail: z.email().nullable(),
      supportPhone: pending,
      supportHours: pending,
      socialLinks: z.array(z.url()),
    }),
    localization: z.strictObject({
      defaultLocale: localeCode,
      locales: z
        .array(z.strictObject({ code: localeCode, direction: z.enum(['rtl', 'ltr']), label: text }))
        .min(1),
      displayCurrency: z.literal('IRT'),
      storageCurrency: z.literal('IRR'),
      englishPricesAreTranslatedOnly: z.boolean(),
    }),
    appearance: z.strictObject({
      defaultTheme: z.enum(['system', 'light', 'dark']),
      availableThemes: z.array(z.enum(['light', 'dark'])).min(2),
      style: z.literal('modern-minimal-glass'),
      primaryColor: color,
      logoColors: z.strictObject({ light: palette, dark: palette }),
      persianFont: pending,
      latinFont: pending,
    }),
    auth: z.strictObject({
      initialMethod: z.literal('email-password'),
      plannedMethod: z.literal('phone-otp'),
      googleOAuthEnabled: z.boolean(),
    }),
    commerce: z.strictObject({
      paymentProvider: pending,
      shippingProvider: pending,
      shippingRegions: z.array(text),
      guestCheckout: z.boolean().nullable(),
      taxPolicy: pending,
      inventoryReservationMinutes: z.number().int().positive().nullable(),
      returnPolicyApproved: z.boolean(),
    }),
    ai: z.strictObject({
      customerAssistantEnabled: z.boolean(),
      adminAssistantEnabled: z.boolean(),
      provider: pending,
      model: pending,
      monthlyBudget: z.number().positive().nullable(),
      budgetCurrency: pending,
    }),
    deployment: z.strictObject({
      hostingProvider: pending,
      storageProvider: pending,
      transactionalEmailProvider: pending,
      smsProvider: pending,
      analyticsProvider: pending,
    }),
  })
  .superRefine((config, context) => {
    const codes = config.localization.locales.map((locale) => locale.code);
    if (new Set(codes).size !== codes.length)
      context.addIssue({
        code: 'custom',
        path: ['localization', 'locales'],
        message: 'Duplicate locale',
      });
    if (!codes.includes(config.localization.defaultLocale))
      context.addIssue({
        code: 'custom',
        path: ['localization', 'defaultLocale'],
        message: 'Default locale must be enabled',
      });
    for (const code of codes) {
      if (!config.brand.names[code])
        context.addIssue({
          code: 'custom',
          path: ['brand', 'names', code],
          message: 'Each locale requires a brand name',
        });
    }
    if (new Set(config.appearance.availableThemes).size !== 2)
      context.addIssue({
        code: 'custom',
        path: ['appearance', 'availableThemes'],
        message: 'Light and dark themes are required',
      });
  });

export type BusinessConfig = z.infer<typeof businessSchema>;

export function releaseIssues(config: BusinessConfig): string[] {
  const required = {
    'brand.domain': config.brand.domain,
    'brand.legalName': config.brand.legalName,
    'business.sellerAddress': config.business.sellerAddress,
    'contact.supportEmail': config.contact.supportEmail,
    'contact.supportPhone': config.contact.supportPhone,
    'commerce.paymentProvider': config.commerce.paymentProvider,
    'commerce.shippingProvider': config.commerce.shippingProvider,
    'commerce.taxPolicy': config.commerce.taxPolicy,
    'commerce.inventoryReservationMinutes': config.commerce.inventoryReservationMinutes,
    'deployment.hostingProvider': config.deployment.hostingProvider,
    'deployment.storageProvider': config.deployment.storageProvider,
    'deployment.transactionalEmailProvider': config.deployment.transactionalEmailProvider,
  };
  const issues = Object.entries(required)
    .filter(([, value]) => value === null)
    .map(([key]) => key);
  if (config.commerce.guestCheckout === null) issues.push('commerce.guestCheckout');
  if (!config.commerce.returnPolicyApproved) issues.push('commerce.returnPolicyApproved');
  if (!config.commerce.shippingRegions.length) issues.push('commerce.shippingRegions');
  for (const { code } of config.localization.locales) {
    if (!config.brand.descriptions[code]) issues.push(`brand.descriptions.${code}`);
  }
  if (config.ai.customerAssistantEnabled || config.ai.adminAssistantEnabled) {
    if (
      !config.ai.provider ||
      !config.ai.model ||
      !config.ai.monthlyBudget ||
      !config.ai.budgetCurrency
    )
      issues.push('ai.provider/model/budget');
  }
  return issues;
}
