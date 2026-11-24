import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';
import { root } from './environment.mjs';
const output = join(root, 'dist');
await mkdir(output, { recursive: true });
// Lista explícita: nunca publicar docs/, server/, .env o el repositorio completo.
for (const name of ['index.html', 'history.js', 'carnet.js', 'attention-controller.js', 'attention.js', 'attention-validation.js', 'attention.css', 'patients.js', 'owners.js', 'offline-ui.js', 'auth.js', 'auth.css', 'main.js', 'view-state.js', 'views.js', 'diagnostics.js', 'styles.css', 'mobile.css', 'application.css']) await cp(join(root, 'web', name), join(output, name));
await build({entryPoints:[join(root,'web','qrcode-entry.js')],bundle:true,minify:true,format:'iife',outfile:join(output,'qrcode.min.js')});
const expected = new Set(['index.html', 'history.js', 'carnet.js', 'attention-controller.js', 'attention.js', 'attention-validation.js', 'attention.css', 'patients.js', 'owners.js', 'offline-ui.js', 'auth.js', 'auth.css', 'main.js', 'view-state.js', 'views.js', 'diagnostics.js', 'styles.css', 'mobile.css', 'application.css', 'qrcode.min.js']);
for (const name of await readdir(output)) if (!expected.has(name)) throw new Error('dist contiene un archivo inesperado. Revisarlo antes de publicar.');
console.log('Web preparada en dist/. No se ha desplegado.');
