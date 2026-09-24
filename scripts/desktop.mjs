import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { root, loadEnvironment, port } from './environment.mjs';
import { startServices } from './services.mjs';
loadEnvironment();
let electron;
try { electron = createRequire(import.meta.url)('electron'); } catch { console.error('Electron no está instalado. Ejecuta npm install con acceso a registry.npmjs.org.'); process.exit(1); }
let services;
try {
  services = await startServices({ webPort: port(process.env.WEB_PORT, 5173), apiPort: port(process.env.API_PORT, 8787) });
  const child = spawn(electron, ['.'], { cwd: root, env: { ...process.env, VETCARE_DEV_URL: services.url }, stdio: 'inherit' });
  const stop = async () => { child.kill(); await services.stop(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  child.on('error', async error => { console.error(error.message); await services.stop(); process.exitCode = 1; });
  child.on('exit', async code => { await services.stop(); process.exitCode = code || 0; });
} catch (error) { if (services) await services.stop(); console.error(error.message); process.exitCode = 1; }
