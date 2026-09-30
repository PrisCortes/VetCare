# T16 — Preparar el almacenamiento de información en el equipo

## Identificación

| Dato | Valor |
| --- | --- |
| Fase | 4.0 — Desarrollo core fase 1 |
| Responsable documental | Oscar Aarón Delgadillo Fernández (OD) |
| Inicio previsto | 24 de septiembre de 2026 |
| Fin previsto | 30 de septiembre de 2026 |
| Preparación de esta entrega | 18 de noviembre de 2026 |
| Estado | Base de almacenamiento implementada y probada automáticamente; comprobación visual del usuario pendiente |

Se conservan fechas del cronograma. La implementación actual prepara SQLite, sin adelantar módulos clínicos, autenticación offline, snapshots o sincronización. No se considera registro de pacientes o expediente un texto técnico de prueba.

## Comprobación práctica

Cerrar la ventana de Electron y el proceso de desarrollo anterior. Desde la raíz del proyecto:

```powershell
npm run dev:desktop
```

1. Confirmar que Cliente indica Electron y SQLite local indica Disponible, con esquema 1.
2. En “Prueba de persistencia local”, escribir un texto ficticio, por ejemplo “Prueba T16”. No usar datos personales o clínicos.
3. Pulsar “Guardar en SQLite”. El texto y la fecha deben aparecer como último dato guardado.
4. Cerrar Electron completamente, volver a ejecutar el comando y comprobar que el último dato guardado permanece visible.
5. Cambiar el texto, guardar y repetir si se desea. El dato técnico se actualiza en una única fila, sin generar pacientes ficticios ni registros clínicos.

En navegador web no aparece el panel de escritura local, porque no existe el puente Electron. MariaDB sigue sin configurar; su estado no cambia por abrir SQLite.

La ventana todavía usa el lanzador de desarrollo de T15, con web/PHP locales. El módulo de SQLite no requiere red, pero la aplicación clínica offline completa corresponde a T25 y no se acredita por este arranque de desarrollo.

## Archivos y responsabilidades

| Archivo | Función |
| --- | --- |
| [storage.cjs](../../desktop/storage.cjs) | Abrir SQLite, aplicar migraciones, comprobar estado y guardar/leer la prueba |
| [001_storage.sql](../../database/sqlite/001_storage.sql) | Tablas iniciales de metadatos y prueba técnica |
| [main.cjs](../../desktop/main.cjs) | Abrir almacén, validar origen IPC y cerrar conexión al salir |
| [preload.cjs](../../desktop/preload.cjs) | Exponer solo estado, lectura y guardado de prueba; nunca SQL o rutas arbitrarias |
| [main.js](../../web/main.js) | Mostrar diagnóstico local y confirmar únicamente resultados devueltos por SQLite |
| [storage.test.mjs](../../tests/storage.test.mjs) | Casos de persistencia, integridad y migraciones |
| [test-desktop-storage.mjs](../../scripts/test-desktop-storage.mjs) | Ejecutar esas pruebas con el Node integrado en Electron |

## Motor y ubicación

Se utiliza node:sqlite incluido en Node/Electron, sin agregar otra dependencia nativa. Se comprobó con Node 24.19.0 y con el ejecutable Electron instalado 45.3.4 en modo de ejecución Node. No se alteró la versión/rango de Electron que el usuario ya tenía en package.json o package-lock.json.

La ubicación se construye desde app.getPath('userData'), dentro de:

```text
storage/development/preauth-probe/vetcare.sqlite
```

Es una ruta relativa al directorio de usuario de la aplicación, no al repositorio ni a la instalación del programa. El nombre exacto del directorio padre depende de Electron y de la configuración del equipo. No se publica esa ruta por el IPC ni se permite elegir otra desde la página.

La partición preauth-probe es exclusivamente técnica: no tiene autenticación ni representa el almacén clínico final. Cuando existan cuentas, sus almacenes se vincularán a identidad/ámbito conforme a T12; no se migrará una prueba anónima a expediente. SQLite no está cifrado automáticamente y la prueba no acredita protección frente a acceso físico.

## Esquema inicial y guardado

| Tabla | Contenido |
| --- | --- |
| schema_migrations | Versión aplicada, checksum y fecha técnica |
| app_metadata | Propósito del archivo de datos |
| persistence_probe | Una fila con ID fijo, texto de prueba y fecha de guardado |

Configuración: claves foráneas activadas, WAL, synchronous FULL y espera por bloqueo limitada a cinco segundos. Las tablas son STRICT. Migración y registro de versión se aplican en una transacción; el guardado de prueba utiliza consulta parametrizada y transacción.

La migración ya aplicada se verifica por SHA-256, normalizando finales de línea para no confundir LF/CRLF con cambio de esquema. Una migración modificada o una versión desconocida interrumpe la apertura; no se eliminan tablas ni se crea un archivo vacío para ocultar el problema.

La entrada de prueba exige texto no vacío de hasta 200 caracteres, validado también en el proceso principal. No se acepta SQL, nombres de tablas, claves de configuración ni rutas desde el renderizador. El resultado se devuelve tras confirmar la transacción. Los errores no se presentan como éxito ni se insertan mediante HTML.

El diagnóstico ejecuta quick_check y foreign_key_check por separado. Es una comprobación del archivo actual, no una garantía de resistencia a cualquier corte de energía o daño físico. El cierre normal libera la conexión sin borrar archivos WAL/SHM manualmente.

## Evidencia automática

```powershell
npm test
npm run test:storage
npm run test:desktop-storage
npm run check
npm run build
```

| Recorrido ejecutado | Resultado |
| --- | --- |
| API/configuración más SQLite en Node | Ocho pruebas aprobadas |
| SQLite con ejecutable de Electron | Cinco pruebas aprobadas |
| Crear archivo, guardar, cerrar y reabrir | Texto y marca temporal conservados |
| Reabrir varias veces y actualizar prueba | Una migración aplicada y una fila técnica |
| Entrada vacía, tipo incorrecto o excesiva | Rechazo sin alterar dato existente |
| Texto con comillas y aspecto de SQL | Guardado literal sin ejecutar instrucciones |
| Almacenes distintos | Sin mezcla de datos entre directorios de prueba |
| Conexión cerrada | Operaciones posteriores rechazadas |
| Esquema futuro/checksum alterado | Apertura bloqueada, dato original conservado |
| Sintaxis y build público | Comprobados; sin archivos de base publicados |

Las pruebas crean archivos reales en directorios temporales específicos y los limpian al finalizar, verificando que estén dentro del directorio temporal. No manipulan la base del usuario ni utilizan credenciales. Ejecutar Electron con ELECTRON_RUN_AS_NODE verifica su motor SQLite; no equivale a abrir y probar la ventana gráfica. La comprobación visual corresponde a los pasos iniciales de este documento.

## Relación con tareas posteriores

- T17 conecta pantallas ejecutables; T20/T21 incorporan propietarios/pacientes y sus migraciones clínicas.
- T23/T25 incorporan guardado clínico y operación offline, conservando revisiones y pendientes según el diseño.
- T18 prepara MariaDB; abrir SQLite no crea o conecta la base central.
- T36/T37 implementan snapshots y restauración. Esta entrega no crea respaldos por consulta ni los declara probados.
- D-T5-01/02/03 siguen candidatas. No se fijaron relaciones clínicas o reglas médicas definitivas en la migración técnica de T16.

## Cierre

- [x] Abrir un archivo SQLite en almacenamiento de usuario del escritorio.
- [x] Aplicar migración inicial versionada sin repetición.
- [x] Guardar y recuperar un dato técnico mediante IPC restringido.
- [x] Comprobar persistencia tras cerrar/reabrir con motores Node y Electron.
- [x] Rechazar entradas inválidas y esquemas incompatibles sin borrar información.
- [ ] Completar el recorrido visual de guardado y reapertura con el usuario.

Resultado: base de persistencia local T16 implementada. No se declara completo el sistema clínico ni su seguridad offline.

Siguiente tarea: T17 — Crear las pantallas de la aplicación de escritorio; responsable Diego Alonso Coronel Vargas; ventana documental del 24 de septiembre al 2 de octubre de 2026.
