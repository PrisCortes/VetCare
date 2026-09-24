import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export function loadEnvironment() {
  let text;
  try { text = readFileSync(join(root, '.env'), 'utf8'); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    const value = match[2].trim();
    process.env[match[1]] = /^(['"]).*\1$/.test(value) ? value.slice(1, -1) : value;
  }
}
export function port(value, fallback) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 65535) throw new Error('Puerto local inválido.');
  return number;
}
export function phpCommand() {
  const binary = process.env.PHP_BINARY || 'php';
  const probe = spawnSync(binary, ['-r', 'echo PHP_BINARY;'], { encoding: 'utf8', windowsHide: true });
  if (probe.error || probe.status !== 0) throw new Error('No se encontró PHP. Configura PHP_BINARY en .env.');
  const resolved = probe.stdout.trim();
  if (!isAbsolute(resolved)) throw new Error('PHP devolvió una ruta no válida.');
  const args = ['-c', join(root, 'config/php.ini')];
  if (process.platform === 'win32') args.push('-d', `extension_dir=${join(dirname(resolved), 'ext')}`);
  return { binary: resolved, args };
}
