import { spawnSync } from 'node:child_process';
import { root, loadEnvironment, phpCommand } from './environment.mjs';

loadEnvironment();
const php = phpCommand();
const response = spawnSync(php.binary, [...php.args, 'server/check-database.php'], {
  cwd: root, encoding: 'utf8', windowsHide: true,
});
if (response.stdout) process.stdout.write(response.stdout);
if (response.error || response.stderr) console.error('No se pudo completar el diagnóstico PHP.');
process.exitCode = response.status === 0 ? 0 : 1;
