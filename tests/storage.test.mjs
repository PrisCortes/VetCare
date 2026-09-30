import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { openLocalStore } = require('../desktop/storage.cjs');
const { DatabaseSync } = require('node:sqlite');
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'vetcare-t16-'));
  t.after(() => { const absolute = resolve(directory); assert.ok(absolute.startsWith(resolve(tmpdir()) + sep)); rmSync(absolute, { recursive: true, force: true }); });
  return directory;
}
test('crea SQLite y conserva texto después de cerrar y reabrir', t => {
  const dir = fixture(t); let store = openLocalStore(dir);
  try {
    assert.equal(store.readProbe(), null); assert.deepEqual(store.status(), { engine:'SQLite', schemaVersion:1, integrity:true, journal:'wal', foreignKeys:true, purpose:'development-storage-probe' });
    const record = store.saveProbe("Prueba T16 · ' ; DROP TABLE persistence_probe; --");
    store.close(); store = openLocalStore(dir);
    assert.deepEqual(store.readProbe(), record); assert.ok(existsSync(join(dir, 'vetcare.sqlite')));
    assert.equal(store.status().integrity, true);
  } finally { store.close(); }
});
test('no repite migraciones y actualiza únicamente el dato técnico', t => {
  const dir = fixture(t); const first = openLocalStore(dir); first.saveProbe('Uno'); first.close();
  const second = openLocalStore(dir);
  try { second.saveProbe('Dos'); assert.equal(second.readProbe().text,'Dos'); } finally { second.close(); }
  const db = new DatabaseSync(join(dir,'vetcare.sqlite'));
  try { assert.equal(db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n,1); assert.equal(db.prepare('SELECT count(*) AS n FROM persistence_probe').get().n,1); } finally { db.close(); }
});
test('valida entradas antes de alterar un dato guardado', t => {
  const store = openLocalStore(fixture(t));
  try {
    store.saveProbe('Conservar');
    for (const invalid of ['', '   ', null, {}, 'a'.repeat(201)]) assert.throws(() => store.saveProbe(invalid));
    assert.equal(store.readProbe().text,'Conservar');
  } finally { store.close(); }
});
test('no mezcla almacenes y rechaza uso tras cerrar', t => {
  const a = openLocalStore(fixture(t)), b = openLocalStore(fixture(t));
  try { a.saveProbe('A'); assert.equal(b.readProbe(),null); } finally { a.close(); b.close(); }
  assert.throws(() => a.readProbe());
});
test('rechaza esquema futuro y checksum alterado sin borrar el dato', t => {
  for (const sql of ["INSERT INTO schema_migrations VALUES (99, 'future', '2026-11-18')", "UPDATE schema_migrations SET checksum = 'alterado' WHERE version = 1"]) {
    const dir = fixture(t), store = openLocalStore(dir); store.saveProbe('Original'); store.close();
    const db = new DatabaseSync(join(dir,'vetcare.sqlite')); db.exec(sql); db.close();
    assert.throws(() => openLocalStore(dir));
    const check = new DatabaseSync(join(dir,'vetcare.sqlite')); try { assert.equal(check.prepare('SELECT texto FROM persistence_probe').get().texto,'Original'); } finally { check.close(); }
  }
});
