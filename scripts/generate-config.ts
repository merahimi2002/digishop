import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { releaseIssues } from '../src/config/business-schema';
import { initializeTheme } from '../src/lib/theme';
import { extractLogoShapes, readBusinessConfig, workspaceAsset } from './config-lib';

const config = await readBusinessConfig();
if (process.argv.includes('--release')) {
  const issues = releaseIssues(config);
  if (issues.length) throw new Error(`Release configuration incomplete: ${issues.join(', ')}`);
}
const publicSite = {
  brand: {
    key: config.brand.key,
    names: config.brand.names,
    descriptions: config.brand.descriptions,
    domain: config.brand.domain,
  },
  localization: config.localization,
  appearance: config.appearance,
  timezone: config.business.timezone,
};
const lightSvg = await workspaceAsset(config.brand.logoLightPath);
const darkSvg = await workspaceAsset(config.brand.logoDarkPath);
const logo = { light: extractLogoShapes(lightSvg), dark: extractLogoShapes(darkSvg) };
const colors = config.appearance.logoColors;
const generated = '// Generated from doc/BUSINESS_CONFIG.md. Do not edit.\n';
const css = `/* Generated from doc/BUSINESS_CONFIG.md. Do not edit. */\n:root { --brand-primary: ${config.appearance.primaryColor}; --logo-base: ${colors.light.base}; --logo-accent: ${colors.light.accent}; }\n.dark { --logo-base: ${colors.dark.base}; --logo-accent: ${colors.dark.accent}; }\n`;
const outputs = new Map([
  [
    'public/brand/theme-init.js',
    `/* Generated from doc/BUSINESS_CONFIG.md. */\n(${initializeTheme.toString()})(${JSON.stringify(config.appearance.defaultTheme)});\n`,
  ],
  [
    'src/config/generated/site.ts',
    `${generated}export const siteConfig = ${JSON.stringify(publicSite, null, 2)} as const;\nexport type Locale = (typeof siteConfig.localization.locales)[number]['code'];\n`,
  ],
  [
    'src/config/generated/logo.ts',
    `${generated}export const logoGeometry = ${JSON.stringify(logo, null, 2)} as const;\n`,
  ],
  ['src/app/brand.generated.css', css],
  [
    'public/brand/mark.svg',
    lightSvg.replace(
      /aria-label="[^"]*"/,
      `aria-label="${config.brand.names[config.localization.defaultLocale]!.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)}"`,
    ),
  ],
]);
const check = process.argv.includes('--check');
for (const [filename, content] of outputs) {
  if (check) {
    const actual = await readFile(filename, 'utf8').catch(() => '');
    if (actual !== content)
      throw new Error(`Generated file is stale: ${filename}. Run pnpm config:generate.`);
  } else {
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, content);
  }
}
console.log(
  `Business config valid; ${outputs.size} generated files ${check ? 'verified' : 'written'}.`,
);
