import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { root, phpCommand } from '../scripts/environment.mjs';

const php = phpCommand();
function check(values = {}, code = null) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith('DB_')) delete env[key];
  Object.assign(env, values);
  const result = spawnSync(php.binary, [...php.args, ...(code ? ['-r', code] : ['server/check-database.php'])], {
    cwd: root, env, encoding: 'utf8', windowsHide: true,
  });
  assert.equal(result.stderr, '');
  assert.ok(!result.stdout.includes('secret-password'));
  return { exit: result.status, data: JSON.parse(result.stdout) };
}
const valid = { DB_HOST: 'db.example.com', DB_NAME: 'vetcare', DB_USER: 'user', DB_PASSWORD: 'secret-password' };

test('diagnóstico distingue falta de configuración sin revelar secretos', () => {
  assert.deepEqual(check(), { exit: 1, data: { status: 'unavailable', code: 'DB_NOT_CONFIGURED' } });
});

test('rechaza configuración parcial e inyección en DSN antes de conectar', () => {
  for (const overrides of [
    { DB_HOST: 'host;dbname=other' }, { DB_NAME: 'data;charset=latin1' },
    { DB_PASSWORD: '' }, { DB_PORT: '0' }, { DB_PORT: '65536' }, { DB_PORT: '3306;foo=x' },
  ]) {
    assert.equal(check({ ...valid, ...overrides }).data.code, 'DB_INVALID_CONFIGURATION');
  }
});

test('no permite conexión sin certificado CA legible', () => {
  for (const DB_SSL_CA of ['', 'storage/does-not-exist.pem']) {
    assert.equal(check({ ...valid, DB_SSL_CA }).data.code, 'DB_CA_REQUIRED');
  }
});

test('acepta una CA codificada para el contenedor sin incluirla en la imagen', () => {
  const code = `require 'server/database.php'; $c = \\VetCare\\databaseConfiguration(); echo json_encode(['caReadable' => is_file($c['ca'])]);`;
  assert.deepEqual(check({ ...valid, DB_SSL_CA_BASE64: Buffer.from('certificate fixture').toString('base64') }, code), {
    exit: 0, data: { caReadable: true },
  });
});

test('opciones construyen DSN UTF-8, conservan la contraseña y reutilizan conexiones TLS', () => {
  const code = `require 'server/database.php'; $c = \\VetCare\\databaseConfiguration(); echo json_encode(['dsn' => $c['dsn'], 'passwordIntact' => $c['password'] === 'secret-password', 'persistent' => $c['persistent']]);`;
  assert.deepEqual(check({ ...valid, DB_SSL_CA: 'tests/central-database.test.mjs' }, code), {
    exit: 0, data: { dsn: 'mysql:host=db.example.com;port=3306;dbname=vetcare;charset=utf8mb4', passwordIntact: true, persistent: true },
  });
});

test('permite desactivar conexiones persistentes solo mediante una opción explícita', () => {
  const code = `require 'server/database.php'; $c = \\VetCare\\databaseConfiguration(); echo json_encode(['persistent' => $c['persistent']]);`;
  assert.deepEqual(check({ ...valid, DB_SSL_CA: 'tests/central-database.test.mjs', DB_PERSISTENT: '0' }, code), {
    exit: 0, data: { persistent: false },
  });
  assert.equal(check({ ...valid, DB_SSL_CA: 'tests/central-database.test.mjs', DB_PERSISTENT: 'yes' }).data.code, 'DB_INVALID_CONFIGURATION');
});

test('diagnóstico clasifica fallos de conexión sin incluir secretos', () => {
  const code = `require 'server/database.php'; echo json_encode([\\VetCare\\databaseDiagnosticCode(new PDOException('SQLSTATE[HY000] [2002] Connection refused')),\\VetCare\\databaseDiagnosticCode(new PDOException('SQLSTATE[HY000] [1045] Access denied'))]);`;
  assert.deepEqual(check({}, code), { exit: 0, data: ['DB_NETWORK_FAILED', 'DB_AUTH_FAILED'] });
});
