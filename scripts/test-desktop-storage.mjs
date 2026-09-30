import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { root } from './environment.mjs';
const require = createRequire(import.meta.url);
let electron;
try { electron = require('electron'); } catch { console.error('Instala Electron con npm install.'); process.exit(1); }
const result = spawnSync(electron, ['--test','tests/storage.test.mjs'], { cwd:root, env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}, windowsHide:true, stdio:'inherit' });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
