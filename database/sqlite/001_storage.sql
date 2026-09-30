CREATE TABLE app_metadata (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
) STRICT;

CREATE TABLE persistence_probe (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  texto TEXT NOT NULL CHECK (length(texto) BETWEEN 1 AND 200),
  actualizado_en TEXT NOT NULL
) STRICT;

INSERT INTO app_metadata(clave, valor) VALUES ('purpose', 'development-storage-probe');
