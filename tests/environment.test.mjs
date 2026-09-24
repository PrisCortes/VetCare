import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { startServices } from '../scripts/services.mjs';
import { loadEnvironment } from '../scripts/environment.mjs';
loadEnvironment();
async function unusedPort() { const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
test('web y PHP locales: salud, errores y aislamiento de archivos', async () => {
  const webPort = await unusedPort(); let apiPort = await unusedPort(); while (apiPort === webPort) apiPort = await unusedPort();
  const services = await startServices({ webPort, apiPort });
  try {
    const page = await fetch(services.url); assert.equal(page.status, 200); assert.match(await page.text(), /Preparación del sistema/);
    const health = await fetch(services.url + '/api/v1/health'); assert.equal(health.status, 200); assert.deepEqual(await health.json(), { service: 'vetcare-api', status: 'ok', database: 'not_configured' });
    const method = await fetch(services.url + '/api/v1/health', { method: 'POST' }); assert.equal(method.status, 405); assert.equal(method.headers.get('allow'), 'GET');
    const missing = await fetch(services.url + '/api/v1/patients'); assert.equal(missing.status, 404); assert.equal((await missing.json()).error.code, 'NOT_FOUND');
    for (const path of ['/.env', '/package.json', '/server/bootstrap.php', '/docs/gestion/T01_revision_documental.md', '/%2e%2e%2fREADME.md']) {
      assert.equal((await fetch(services.url + path)).status, 404, path);
    }
    assert.equal((await fetch(services.apiUrl + '/server/bootstrap.php')).status, 404);
    assert.equal((await fetch(services.url + '/styles.css')).headers.get('content-type'), 'text/css; charset=utf-8');
  } finally { await services.stop(); }
});
