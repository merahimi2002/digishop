import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { businessSchema } from '../src/config/business-schema';

export async function readBusinessConfig(filename = 'doc/BUSINESS_CONFIG.md') {
  const markdown = await readFile(filename, 'utf8');
  const blocks = [...markdown.matchAll(/^```yaml\s*\r?\n([\s\S]*?)^```\s*$/gm)];
  if (blocks.length !== 1 || !blocks[0]?.[1])
    throw new Error('Expected exactly one YAML configuration block.');
  return businessSchema.parse(parse(blocks[0][1]));
}

export async function workspaceAsset(assetPath: string) {
  if (path.isAbsolute(assetPath) || assetPath.includes('..') || !assetPath.startsWith('assets/'))
    throw new Error('Assets must stay inside the workspace assets directory.');
  const root = await realpath('assets');
  const resolved = await realpath(assetPath);
  if (!resolved.startsWith(root + path.sep)) throw new Error('Asset escapes workspace.');
  return readFile(resolved, 'utf8');
}

export function extractLogoShapes(svg: string) {
  if (/<(?:script|image|foreignObject|text)\b|\bon\w+\s*=|(?:href|url)\s*[=(]/i.test(svg))
    throw new Error('Logo must contain safe, local vector geometry only.');
  const viewBox = svg.match(/viewBox="([\d .-]+)"/)?.[1];
  if (!viewBox) throw new Error('Logo requires a viewBox.');
  const shapes = [...svg.matchAll(/<(path|circle)\b([^>]*?)\/?\s*>/g)].map((match) => {
    const attrs = Object.fromEntries(
      [...match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)].map((attribute) => [
        attribute[1]!,
        attribute[2]!,
      ]),
    );
    const tone = attrs.class === 'logo-accent' ? 'accent' : 'base';
    if (match[1] === 'path') {
      if (!attrs.d || !/^[\d\s.,+eEMmLlHhVvCcSsQqTtAaZz-]+$/.test(attrs.d))
        throw new Error('Invalid logo path.');
      return { type: 'path' as const, tone, d: attrs.d };
    }
    const [cx, cy, r] = [attrs.cx, attrs.cy, attrs.r].map(Number);
    if (![cx, cy, r].every((value) => value !== undefined && Number.isFinite(value)) || !r || r < 0)
      throw new Error('Invalid logo circle.');
    return { type: 'circle' as const, tone, cx, cy, r };
  });
  if (!shapes.length) throw new Error('Logo is empty.');
  return { viewBox, shapes };
}
