import { createServer, request as httpRequest } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { root, phpCommand } from './environment.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
export async function startServices({ webPort = 5173, apiPort = 8787 } = {}) {
  if (webPort === apiPort) throw new Error('WEB_PORT y API_PORT deben ser distintos.');
  const php = phpCommand();
  const child = spawn(php.binary, [...php.args, '-S', `127.0.0.1:${apiPort}`, '-t', 'api', 'api/router.php'], { cwd: root, env: { ...process.env, APP_ORIGIN: process.env.APP_ORIGIN || `http://127.0.0.1:${webPort}` }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let childError = ''; child.stderr.on('data', data => { childError = (childError + data.toString()).slice(-2000); });
  child.stdout.resume();
  let spawnError; child.on('error', error => { spawnError = error; });
  const stopChild = () => { if (child.exitCode === null && !child.killed) child.kill(); };
  const publicRoot = await realpath(resolve(root, 'web'));
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    let path;
    try { path = decodeURIComponent((req.url || '/').split('?')[0]); } catch { res.writeHead(400); res.end('Ruta inválida'); return; }
    if (path.startsWith('/api/')) {
      let timedOut = false;
      const upstream = httpRequest({ hostname: '127.0.0.1', port: apiPort, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${apiPort}` }, timeout: 45000 }, remote => {
        res.writeHead(remote.statusCode || 502, remote.headers); remote.pipe(res);
      });
      upstream.on('timeout', () => { timedOut = true; upstream.destroy(); });
      upstream.on('error', () => {
        if (!res.headersSent) res.writeHead(timedOut ? 504 : 502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: timedOut
          ? { code: 'API_TIMEOUT', message: 'El servicio central está tardando más de lo habitual. Intenta de nuevo en unos minutos.' }
          : { code: 'API_UNAVAILABLE', message: 'No se pudo contactar con PHP. Reinicia npm run dev y revisa su terminal.' } }));
      });
      req.pipe(upstream); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const candidate = resolve(publicRoot, '.' + (path === '/' ? '/index.html' : path));
    try {
      const actual = await realpath(candidate);
      if (!actual.startsWith(publicRoot + sep)) throw new Error('Outside public root');
      const type = types[extname(actual)];
      if (!type) throw new Error('Non-public type');
      const body = await readFile(actual);
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length }); res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); }
  });
  const stop = async () => { stopChild(); if (server.listening) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
  try {
    await new Promise((resolveReady, reject) => { server.once('error', reject); server.listen(webPort, '127.0.0.1', resolveReady); });
    let ready = false, lastError = '';
    for (let i = 0; i < 40; i++) {
      if (spawnError || child.exitCode !== null) throw new Error('No se pudo iniciar PHP: ' + (spawnError?.message || childError));
      try {
        const response = await fetch(`http://127.0.0.1:${apiPort}/api/v1/health`, { signal: AbortSignal.timeout(400) });
        const body = await response.json();
        if (response.ok && body.service === 'vetcare-api') { ready = true; break; }
      } catch (error) { lastError = `${error.message} (${error.cause?.code || 'sin código'})`; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('PHP no respondió dentro del plazo. ' + lastError + '\n' + childError);
    return { url: `http://127.0.0.1:${webPort}`, apiUrl: `http://127.0.0.1:${apiPort}`, stop };
  } catch (error) { await stop(); throw error; }
}
