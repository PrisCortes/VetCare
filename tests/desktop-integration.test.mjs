import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { applicationRuntime, desktopEnvironment } = require('../desktop/runtime.cjs');

test('T38: Electron integra web local o central sin exponer secretos de backend', async () => {
  const [main, preload, page, authClient] = await Promise.all([
    readFile(new URL('../desktop/main.cjs', import.meta.url), 'utf8'),
    readFile(new URL('../desktop/preload.cjs', import.meta.url), 'utf8'),
    readFile(new URL('../web/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../desktop/auth.cjs', import.meta.url), 'utf8'),
  ]);
  assert.match(main, /contextIsolation: true/); assert.match(main, /sandbox: true/); assert.doesNotMatch(preload, /require\(['"]node:/);
  assert.match(main, /shell\.openExternal/); assert.match(main, /isPublicConsultationDocument/);
  assert.match(preload, /vetcare:auth/); assert.match(preload, /vetcare:offline/); assert.match(page, /INTEGRACIÓN · T38/);
  assert.match(authClient, /carnet:\['GET','\/carnet'\]/);
  assert.deepEqual(applicationRuntime({ VETCARE_APP_URL: 'https://vetcare.example/' }), { source: 'https://vetcare.example', mode: 'central' });
  assert.deepEqual(desktopEnvironment({ DB_HOST: 'secret', DB_PASSWORD: 'secret', OFFLINE_PRIVATE_KEY: 'key', OFFLINE_PRIVATE_KEY_BASE64: 'key-base64', VETCARE_APP_URL: 'https://vetcare.example/' }), { VETCARE_APP_URL: 'https://vetcare.example/' });
});

test('T41: al recuperar la red y al cerrar normalmente se intenta enviar la cola durable', async () => {
  const [main, offlineUi, auth] = await Promise.all([
    readFile(new URL('../desktop/main.cjs', import.meta.url), 'utf8'),
    readFile(new URL('../web/offline-ui.js', import.meta.url), 'utf8'),
    readFile(new URL('../desktop/auth.cjs', import.meta.url), 'utf8'),
  ]);
  assert.match(main, /window\.on\('close'/); assert.match(main, /offline\.command\('sync',\{timeoutMs:4000\}\)/);
  assert.match(offlineUi, /window\.addEventListener\('online'/); assert.match(offlineUi, /synchronize\(\{automatic:true\}\)/);
  assert.match(auth, /AbortSignal\.timeout\(timeoutMs\)/);
});
