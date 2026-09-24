import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, loadEnvironment, phpCommand } from './environment.mjs';
loadEnvironment();
const php = phpCommand();
let failed = false;
async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) { await visit(file); continue; }
    const phpFile = file.endsWith('.php');
    if (!phpFile && !/\.(mjs|cjs|js)$/.test(file)) continue;
    const result = spawnSync(phpFile ? php.binary : process.execPath, phpFile ? [...php.args, '-l', file] : ['--check', file], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) { failed = true; console.error(result.stderr || result.stdout); }
  }
}
for (const name of ['scripts', 'web', 'desktop', 'api', 'server', 'tests']) await visit(join(root, name));
if (failed) process.exitCode = 1; else console.log('Sintaxis PHP y JavaScript correcta.');
