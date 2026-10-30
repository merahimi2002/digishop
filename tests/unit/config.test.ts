import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { businessSchema, releaseIssues } from '../../src/config/business-schema';
import { extractLogoShapes, readBusinessConfig, workspaceAsset } from '../../scripts/config-lib';

describe('central business configuration', () => {
  it('accepts the owner config and a rebrand without editing application code', async () => {
    const config = await readBusinessConfig();
    const rebranded = structuredClone(config);
    rebranded.brand.names = { fa: 'فروشگاه تست', en: 'Example Store' };
    expect(businessSchema.parse(rebranded).brand.names.en).toBe('Example Store');
  });
  it('rejects a default locale not present in the registry and duplicate locales', async () => {
    const config = await readBusinessConfig();
    expect(
      businessSchema.safeParse({
        ...config,
        localization: { ...config.localization, defaultLocale: 'de' },
      }).success,
    ).toBe(false);
    expect(
      businessSchema.safeParse({
        ...config,
        localization: {
          ...config.localization,
          locales: [...config.localization.locales, config.localization.locales[0]],
        },
      }).success,
    ).toBe(false);
  });
  it('rejects invalid colors, missing translated brand names and unknown secret fields', async () => {
    const config = await readBusinessConfig();
    expect(
      businessSchema.safeParse({
        ...config,
        appearance: { ...config.appearance, primaryColor: 'red; display:none' },
      }).success,
    ).toBe(false);
    expect(
      businessSchema.safeParse({ ...config, brand: { ...config.brand, names: {} } }).success,
    ).toBe(false);
    expect(
      businessSchema.safeParse({ ...config, ai: { ...config.ai, apiKey: 'never-store-here' } })
        .success,
    ).toBe(false);
  });
  it('keeps incomplete business data from being release-ready', async () => {
    const issues = releaseIssues(await readBusinessConfig());
    expect(issues).toContain('brand.domain');
    expect(issues).toContain('commerce.paymentProvider');
  });
  it('generates config identical to the central source', async () => {
    const config = await readBusinessConfig();
    const { siteConfig } = await import('../../src/config/generated/site');
    expect(siteConfig.brand.names).toEqual(config.brand.names);
    expect(siteConfig.appearance.logoColors).toEqual(config.appearance.logoColors);
  });
});

describe('vector asset boundary', () => {
  it('loads the real mark as vector paths and circles', async () => {
    const config = await readBusinessConfig();
    const geometry = extractLogoShapes(await workspaceAsset(config.brand.logoLightPath));
    expect(geometry.shapes.filter((shape) => shape.type === 'circle')).toHaveLength(2);
    expect(await readFile('public/brand/mark.svg', 'utf8')).toContain('<svg');
  });
  it('rejects paths escaping assets and active SVG content', async () => {
    await expect(workspaceAsset('assets/../package.json')).rejects.toThrow();
    expect(() =>
      extractLogoShapes('<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>'),
    ).toThrow();
    expect(() =>
      extractLogoShapes('<svg viewBox="0 0 1 1"><image href="data:image/png;base64,AA"/></svg>'),
    ).toThrow();
  });
});
