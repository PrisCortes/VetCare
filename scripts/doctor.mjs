import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { loadEnvironment, phpCommand } from './environment.mjs';
loadEnvironment();
console.log(`Node: ${process.version}`);
try {
  const php = phpCommand();
  const result = spawnSync(php.binary, [...php.args, '-r', 'echo json_encode(["php"=>PHP_VERSION,"pdo_mysql"=>extension_loaded("pdo_mysql"),"openssl"=>extension_loaded("openssl"),"mbstring"=>extension_loaded("mbstring")]);'], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('PHP no pudo cargar la configuración del proyecto.');
  const info = JSON.parse(result.stdout); console.log(JSON.stringify(info, null, 2));
  if (!info.pdo_mysql || !info.openssl || !info.mbstring) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
try { console.log(`Electron: ${createRequire(import.meta.url)('electron/package.json').version}`); } catch { console.log('Electron: pendiente de npm install (requiere red).'); }
