import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Workspace-local tooling only; no global installs or machine PATH changes.
async function get(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
  return response;
}
const pinnedNode = (await readFile('.node-version', 'utf8')).trim();
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const pinnedPnpm = packageJson.packageManager.replace(/^pnpm@/, '');
const releases = await (await get('https://nodejs.org/dist/index.json')).json();
const node = releases.find((release) => release.lts && release.version === `v${pinnedNode}`);
if (!node || !/^\d+\.\d+\.\d+$/.test(pinnedPnpm))
  throw new Error('Expected pinned stable Node LTS and pnpm releases.');
if (process.platform !== 'win32' || process.arch !== 'x64')
  throw new Error('This bootstrap helper targets the current Windows x64 workspace.');
await mkdir('.tools/node', { recursive: true });
const nodeUrl = `https://nodejs.org/dist/${node.version}/win-x64/node.exe`;
const [binaryResponse, checksumResponse] = await Promise.all([
  get(nodeUrl),
  get(`https://nodejs.org/dist/${node.version}/SHASUMS256.txt`),
]);
const binary = Buffer.from(await binaryResponse.arrayBuffer());
const expected = (await checksumResponse.text())
  .split('\n')
  .find((line) => line.trim().endsWith('win-x64/node.exe'))
  ?.split(/\s+/)[0];
if (!expected || createHash('sha256').update(binary).digest('hex') !== expected)
  throw new Error('Node checksum mismatch.');
await writeFile('.tools/node/node.exe', binary);
const metadata = await (
  await get(`https://registry.npmjs.org/@pnpm%2fexe.win32-x64/${pinnedPnpm}`)
).json();
if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) throw new Error('Refusing prerelease pnpm.');
const archive = Buffer.from(await (await get(metadata.dist.tarball)).arrayBuffer());
const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
if (integrity !== metadata.dist.integrity) throw new Error('pnpm package integrity mismatch.');
await mkdir('.tools/pnpm', { recursive: true });
await writeFile('.tools/pnpm.tgz', archive);
execFileSync('tar', ['-xzf', '.tools/pnpm.tgz', '-C', '.tools/pnpm']);
await writeFile(
  '.tools/versions.json',
  JSON.stringify({ node: node.version, pnpm: metadata.version }, null, 2) + '\n',
);
console.log(JSON.stringify({ node: node.version, pnpm: metadata.version, checksumVerified: true }));
