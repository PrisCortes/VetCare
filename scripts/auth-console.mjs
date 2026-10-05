import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { root, loadEnvironment, phpCommand } from './environment.mjs';

loadEnvironment();
const command = process.argv[2];
if (!['migrate', 'create-admin'].includes(command)) throw new Error('Comando no permitido.');
let input;
if (command === 'create-admin') {
  if (!process.stdin.isTTY) throw new Error('Ejecuta este comando desde una terminal interactiva.');
  let mute = false;
  const output = new Writable({ write(chunk, _encoding, done) { if (!mute) process.stdout.write(chunk); done(); } });
  const reader = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const username = await reader.question('Usuario administrador (3–80 letras, números, punto, guion): ');
    const name = await reader.question('Nombre para mostrar: ');
    process.stdout.write('Contraseña (12–72 bytes; entrada oculta): '); mute = true;
    const password = await reader.question('');
    process.stdout.write('\nRepite la contraseña: ');
    const confirmation = await reader.question('');
    process.stdout.write('\n');
    if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
    input = JSON.stringify({ username, name, password });
  } finally { reader.close(); }
}
const php = phpCommand();
const response = spawnSync(php.binary, [...php.args, 'server/auth-console.php', command], {
  cwd: root, input, encoding: 'utf8', windowsHide: true,
});
if (response.stdout) process.stdout.write(response.stdout);
if (response.stderr) process.stderr.write(response.stderr);
if (response.error) console.error('No se pudo ejecutar PHP.');
process.exitCode = response.status === 0 ? 0 : 1;
