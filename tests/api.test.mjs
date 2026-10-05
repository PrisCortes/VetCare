import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { root, loadEnvironment, phpCommand, port } from '../scripts/environment.mjs';
loadEnvironment();
const php = phpCommand();
function call(method, path) {
  const code = `register_shutdown_function(static function (): void { fwrite(STDERR, 'HTTP_STATUS=' . http_response_code()); }); $_SERVER['REQUEST_METHOD'] = $argv[1]; $_SERVER['REQUEST_URI'] = $argv[2]; require 'api/index.php';`;
  const response = spawnSync(php.binary, [...php.args, '-r', code, method, path], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(response.status, 0, response.stderr);
  const status = response.stderr.match(/HTTP_STATUS=(\d+)/);
  assert.ok(status, response.stderr);
  return { status: Number(status[1]), body: JSON.parse(response.stdout) };
}
test('health confirma PHP sin declarar base de datos conectada', () => {
  assert.deepEqual(call('GET', '/api/v1/health'), { status: 200, body: { service: 'vetcare-api', status: 'ok', database: 'not_checked' } });
});
test('rechaza escrituras a health y no revela rutas internas', () => {
  for (const method of ['POST', 'PUT', 'DELETE']) assert.equal(call(method, '/api/v1/health').status, 405);
  for (const path of ['/api/v1/patients', '/.env', '/server/bootstrap.php']) {
    assert.deepEqual(call('GET', path), { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } } });
  }
});
test('rechaza puertos inválidos antes de iniciar procesos', () => {
  for (const value of ['abc', '0', '-1', '65536', '12.5']) assert.throws(() => port(value, 5173));
  assert.equal(port(undefined, 5173), 5173);
});
