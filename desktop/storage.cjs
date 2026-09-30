const { DatabaseSync } = require('node:sqlite');
const { mkdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');

const migrations = [{ version: 1, file: '001_storage.sql' }];
function openLocalStore(directory) {
  mkdirSync(directory, { recursive: true });
  const database = new DatabaseSync(join(directory, 'vetcare.sqlite'), { enableForeignKeyConstraints: true, timeout: 5000 });
  let closed = false;
  try {
    database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    // La tabla de control se crea antes de aplicar migraciones de dominio.
    database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, aplicada_en TEXT NOT NULL) STRICT;');
    const applied = database.prepare('SELECT version, checksum FROM schema_migrations ORDER BY version').all();
    if (applied.some(row => !migrations.some(m => m.version === row.version))) throw new Error('Esquema más reciente o desconocido. No se modificará.');
    for (const migration of migrations) {
      const sql = readFileSync(join(__dirname, '..', 'database', 'sqlite', migration.file), 'utf8').replace(/\r\n/g, '\n');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const previous = applied.find(row => row.version === migration.version);
      if (previous) {
        if (previous.checksum !== checksum) throw new Error('Una migración aplicada fue modificada. Se requiere revisión.');
        continue;
      }
      database.exec('BEGIN IMMEDIATE');
      try {
        database.exec(sql);
        database.prepare('INSERT INTO schema_migrations(version, checksum, aplicada_en) VALUES (?, ?, ?)').run(migration.version, checksum, new Date().toISOString());
        database.exec('COMMIT');
      } catch (error) { database.exec('ROLLBACK'); throw error; }
    }
    const assertOpen = () => { if (closed) throw new Error('Almacenamiento cerrado.'); };
    return {
      status() {
        assertOpen();
        const integrity = database.prepare('PRAGMA quick_check').all().every(row => Object.values(row)[0] === 'ok');
        const references = database.prepare('PRAGMA foreign_key_check').all().length === 0;
        return { engine: 'SQLite', schemaVersion: 1, integrity: integrity && references, journal: database.prepare('PRAGMA journal_mode').get().journal_mode, foreignKeys: database.prepare('PRAGMA foreign_keys').get().foreign_keys === 1, purpose: 'development-storage-probe' };
      },
      readProbe() {
        assertOpen();
        const row = database.prepare('SELECT texto, actualizado_en FROM persistence_probe WHERE id = 1').get();
        return row ? { text: row.texto, updatedAt: row.actualizado_en } : null;
      },
      saveProbe(value) {
        assertOpen();
        if (typeof value !== 'string' || !value.trim() || Array.from(value.trim()).length > 200) throw new Error('Escribe entre 1 y 200 caracteres de prueba.');
        const text = value.trim(), updatedAt = new Date().toISOString();
        database.exec('BEGIN IMMEDIATE');
        try {
          database.prepare('INSERT INTO persistence_probe(id, texto, actualizado_en) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET texto = excluded.texto, actualizado_en = excluded.actualizado_en').run(text, updatedAt);
          database.exec('COMMIT');
        } catch (error) { database.exec('ROLLBACK'); throw error; }
        return { text, updatedAt };
      },
      close() { if (!closed) { database.close(); closed = true; } }
    };
  } catch (error) { database.close(); throw error; }
}
module.exports = { openLocalStore };
