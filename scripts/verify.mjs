import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const requiredFiles = [
  '.env.example',
  'docker-compose.yml',
  'vite.config.ts',
  'apps/api/src/index.ts',
  'apps/api/src/auth.ts',
  'apps/web/vite.config.ts',
  'apps/web/src/App.tsx',
  'packages/db/src/schema.ts',
  'packages/db/drizzle/0000_akiraminafit.sql',
  'packages/contracts/src/index.ts',
  'apps/web/public/pwa-192x192.png',
  'apps/web/public/pwa-512x512.png',
  'apps/web/public/maskable-512x512.png',
];

const failures = [];
for (const relative of requiredFiles) {
  try {
    const info = await stat(path.join(root, relative));
    if (!info.isFile()) failures.push(`${relative} is not a file`);
  } catch {
    failures.push(`${relative} is missing`);
  }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const files = await walk(root);
for (const file of files.filter((item) => item.endsWith('.json'))) {
  try {
    JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    failures.push(`${path.relative(root, file)} has invalid JSON: ${error.message}`);
  }
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const expectedWorkspaces = ['apps/*', 'packages/*'];
if (JSON.stringify(packageJson.workspaces) !== JSON.stringify(expectedWorkspaces)) {
  failures.push('root workspaces are not configured as expected');
}
if (!packageJson.devDependencies?.['vite-plus']) failures.push('vite-plus is missing');

const migration = await readFile(
  path.join(root, 'packages/db/drizzle/0000_akiraminafit.sql'),
  'utf8',
);
for (const table of [
  'users',
  'coach_students',
  'exercises',
  'workout_plans',
  'workout_sessions',
  'body_reports',
]) {
  if (!migration.includes(`"${table}"`)) failures.push(`migration does not contain ${table}`);
}

function pngSize(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') throw new Error('invalid PNG signature');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

for (const [file, expected] of [
  ['apps/web/public/pwa-192x192.png', 192],
  ['apps/web/public/pwa-512x512.png', 512],
  ['apps/web/public/maskable-512x512.png', 512],
]) {
  try {
    const size = pngSize(await readFile(path.join(root, file)));
    if (size.width !== expected || size.height !== expected)
      failures.push(`${file} has unexpected dimensions`);
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}

const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
if (!gitignore.split(/\r?\n/).some((line) => line.trim() === '.env' || line.trim() === '.env.*')) {
  failures.push('real .env files must be excluded by .gitignore');
}

if (failures.length) {
  console.error('AkiraMinaFit verification failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(
  `AkiraMinaFit structure verified: ${files.length} files, ${files.filter((file) => /\.(ts|tsx)$/.test(file)).length} TypeScript files.`,
);
