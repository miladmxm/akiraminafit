import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const rootDirectory = resolve(import.meta.dirname, '..');
const webDistDirectory = resolve(rootDirectory, 'apps/web/dist');
const apiPublicDirectory = resolve(rootDirectory, 'apps/api/public');

function run(command, args) {
  return new Promise((resolveProcess, reject) => {
    const child = spawn(command, args, {
      cwd: rootDirectory,
      env: process.env,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolveProcess();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${signal ?? `code ${code}`}.`));
    });
  });
}

async function main() {
  await run('npm', ['run', 'build', '--workspace=@akiraminafit/web']);
  await rm(apiPublicDirectory, { recursive: true, force: true });
  await cp(webDistDirectory, apiPublicDirectory, { recursive: true });
  await run('npm', ['run', 'build', '--workspace=@akiraminafit/api']);

  const api = spawn('node', ['apps/api/dist/index.js'], {
    cwd: rootDirectory,
    env: process.env,
    stdio: 'inherit',
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => api.kill(signal));
  }

  api.once('error', (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  api.once('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
