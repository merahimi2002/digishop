import { readFile } from 'node:fs/promises';
import { readBusinessConfig } from './config-lib';
import { validateMessageSets } from '../src/i18n/message-validation';

const config = await readBusinessConfig();
const entries = await Promise.all(
  config.localization.locales.map(
    async ({ code }) =>
      [code, JSON.parse(await readFile(`messages/${code}.json`, 'utf8'))] as const,
  ),
);
const count = validateMessageSets(Object.fromEntries(entries), config.localization.defaultLocale);
console.log(
  `Translations valid: ${count} messages across ${entries.length} locales; ICU parameters match.`,
);
