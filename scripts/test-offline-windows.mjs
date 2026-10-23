import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {root} from './environment.mjs';
const electron=createRequire(import.meta.url)('electron'),env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const result=spawnSync(electron,['tests/offline-windows.cjs'],{cwd:root,env,encoding:'utf8',windowsHide:true,timeout:20000});
if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);if(result.status!==0)console.error('La comprobación real de protección Windows/Electron no terminó correctamente. Ejecuta este comando en tu terminal.');process.exitCode=result.status===0?0:1;
