import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './environment.mjs';
const output = join(root, 'dist');
await mkdir(output, { recursive: true });
// Lista explícita: nunca publicar docs/, server/, .env o el repositorio completo.
for (const name of ['index.html', 'main.js', 'styles.css']) await cp(join(root, 'web', name), join(output, name));
const expected = new Set(['index.html', 'main.js', 'styles.css']);
for (const name of await readdir(output)) if (!expected.has(name)) throw new Error('dist contiene un archivo inesperado. Revisarlo antes de publicar.');
console.log('Web preparada en dist/. No se ha desplegado.');
