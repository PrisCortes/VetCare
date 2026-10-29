import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { applicationRuntime, desktopEnvironment } = createRequire(import.meta.url)('../desktop/runtime.cjs');

test('la aplicación distribuida solo acepta el origen HTTPS central', () => {
  assert.deepEqual(applicationRuntime({ VETCARE_APP_URL: 'https://vetcare.example/' }), { source: 'https://vetcare.example', mode: 'central' });
  for (const value of ['http://vetcare.example', 'https://vetcare.example/app', 'https://user:secret@vetcare.example/', 'not-a-url']) assert.throws(() => applicationRuntime({ VETCARE_APP_URL: value }));
  assert.deepEqual(applicationRuntime({ VETCARE_DEV_URL: 'http://127.0.0.1:5173' }), { source: 'http://127.0.0.1:5173', mode: 'development' });
  assert.deepEqual(applicationRuntime({ VETCARE_DEV_URL: 'http://127.0.0.1:5173', VETCARE_APP_URL: 'https://tu-origen-central.example/' }), { source: 'http://127.0.0.1:5173', mode: 'development' });
});

test('el lanzador central no entrega secretos de base ni llave offline a Electron', () => {
  assert.deepEqual(desktopEnvironment({ DB_HOST: 'private', DB_PASSWORD: 'secret', OFFLINE_PRIVATE_KEY: 'private-key', VETCARE_APP_URL: 'https://vetcare.example/', PATH: 'allowed' }), { VETCARE_APP_URL: 'https://vetcare.example/', PATH: 'allowed' });
});
