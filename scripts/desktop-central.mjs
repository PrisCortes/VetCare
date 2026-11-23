import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { root } from './environment.mjs';
const url = process.env.VETCARE_APP_URL;
if (!url) throw new Error('Define VETCARE_APP_URL con el origen HTTPS publicado del servicio central.');
let electron;
try { electron = createRequire(import.meta.url)('electron'); } catch { throw new Error('Electron no está instalado. Ejecuta npm install.'); }
const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('DB_') && !key.startsWith('OFFLINE_PRIVATE_KEY')));
const child = spawn(electron, ['.'], { cwd: root, env: { ...environment, VETCARE_APP_URL: url }, stdio: 'inherit' });
child.on('exit', code => { process.exitCode = code || 0; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
