import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('contenedor de producción construye la interfaz y expone únicamente recursos públicos y PHP',async()=>{
 const [dockerfile,caddyfile,ignored]=await Promise.all([
  readFile(new URL('../Dockerfile',import.meta.url),'utf8'),
  readFile(new URL('../Caddyfile',import.meta.url),'utf8'),
  readFile(new URL('../.dockerignore',import.meta.url),'utf8'),
 ]);
 assert.match(dockerfile,/FROM node:24-alpine AS web-build/);
 assert.match(dockerfile,/RUN npm run build/);
 assert.match(dockerfile,/COPY --from=web-build \/build\/dist\/ \/app\/public\//);
 assert.match(dockerfile,/COPY server\/ \/app\/server\//);
 assert.doesNotMatch(dockerfile,/COPY web\/ \/app\/public\//);
 assert.match(caddyfile,/root \* \/app\/public/);
 assert.match(caddyfile,/rewrite @api \/api\/index\.php/);
 const ignoredLines=new Set(ignored.trim().split(/\r?\n/));
 for(const secret of ['.env','storage','*.pem','*.key'])assert.ok(ignoredLines.has(secret),secret);
});
