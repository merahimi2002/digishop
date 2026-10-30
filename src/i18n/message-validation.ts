import { parse } from '@formatjs/icu-messageformat-parser';

function parameters(value: unknown, output = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) parameters(item, output);
  } else if (value && typeof value === 'object') {
    const node = value as Record<string, unknown>;
    if (
      typeof node.type === 'number' &&
      [1, 2, 3, 4, 5, 6, 8].includes(node.type) &&
      typeof node.value === 'string'
    )
      output.add(`${node.type}:${node.value}`);
    for (const item of Object.values(node))
      if (item && typeof item === 'object') parameters(item, output);
  }
  return output;
}

export function flattenMessages(input: unknown, prefix = ''): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error(`Expected message object at ${prefix}`);
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!key || key.includes('.')) throw new Error(`Invalid message key: ${key}`);
    const name = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' && value.trim()) output[name] = value;
    else if (value && typeof value === 'object' && !Array.isArray(value))
      Object.assign(output, flattenMessages(value, name));
    else throw new Error(`Invalid/empty message at ${name}`);
  }
  return output;
}

export function validateMessageSets(sets: Record<string, unknown>, referenceLocale: string) {
  const reference = flattenMessages(sets[referenceLocale]);
  const keys = Object.keys(reference).sort();
  for (const [locale, messages] of Object.entries(sets)) {
    const flat = flattenMessages(messages);
    if (JSON.stringify(Object.keys(flat).sort()) !== JSON.stringify(keys))
      throw new Error(`Translation key mismatch: ${locale}`);
    for (const key of keys) {
      const expected = [...parameters(parse(reference[key]!))].sort();
      const actual = [...parameters(parse(flat[key]!))].sort();
      if (JSON.stringify(expected) !== JSON.stringify(actual))
        throw new Error(`ICU parameter mismatch: ${locale}.${key}`);
    }
  }
  return keys.length;
}
