# T13 — Planear el guardado y la recuperación de información

## Identificación

| Dato | Valor |
| --- | --- |
| Fase | 3.0 — Diseño de arquitectura e interfaz |
| Responsable documental | Priscila Cortés Ramírez (PC) |
| Inicio previsto | 16 de septiembre de 2026 |
| Fin previsto | 21 de septiembre de 2026 |
| Preparación del diseño | 18 de noviembre de 2026 |
| Estado | Plan técnico preparado; implementación y pruebas pendientes |

Las fechas previstas se conservan del cronograma. No hay todavía datos clínicos persistidos, snapshots o respaldos generados por VetCare. Este documento diseña RE06–RE09/RE14 y la verificación M06; no acredita su cumplimiento.

## Fuentes y decisiones previas

Alcance, diccionario EDT, plan de calidad y riesgos R1/R3; diseños [T8](T08_arquitectura_sistema.md), [T9](T09_modelo_datos.md), [T12](T12_acceso_proteccion.md) y acuerdos [T1](../gestion/T01_revision_documental.md). Se respeta el ajuste: persistencia offline en H3, snapshots completos después de T36 (20–29 de octubre) y verificados antes de H5 (9 de noviembre).

## Capas de protección

| Mecanismo | Qué conserva | Qué no sustituye |
| --- | --- | --- |
| Transacción | Coherencia del guardado local o central | Respaldo fuera del almacenamiento afectado |
| Historial de versiones | Contenido previo y autoría de las modificaciones | Copia independiente ante pérdida del archivo o equipo |
| Snapshot por consulta | Estado recuperable del expediente y contexto de una revisión | Respaldo completo de todas las cuentas, pacientes y pendientes |
| Respaldo local completo | Imagen consistente de SQLite y metadatos necesarios | Copia central ni respaldo fuera del disco local |
| Respaldo central | Datos confirmados en MariaDB y su historial de operaciones | Cambios capturados offline que aún no llegaron al servidor |
| Sincronización | Intercambio y réplica de revisiones | Respaldo: una edición errónea también puede propagarse |

Los checksums detectan alteraciones accidentales comparando una huella conocida. No prueban autenticidad ante un atacante que puede modificar archivo y manifiesto. La autorización y protección de acceso se mantienen separadas según T12.

## Guardado local transaccional

Se propone SQLite en almacenamiento de usuario, separado por cuenta y ámbito autorizado conforme a T12. Proceso principal Electron como único intermediario de escritura; las vistas no acceden al archivo directamente.

1. Validar permiso local, datos y referencias, con identificadores de operación y revisión generados antes del intento.
2. Abrir una transacción de escritura y comprobar la revisión base. Conservar la anterior.
3. Guardar la entidad, la nueva revisión, la operación pendiente y un snapshot lógico de la consulta/expediente dentro de la misma transacción una vez implementado T36.
4. Confirmar la transacción. Si falla, no mostrar éxito ni dejar operación incompleta.
5. Materializar el snapshot independiente y verificarlo. Diferenciar el éxito del guardado local del resultado de esa protección externa.
6. Mostrar estado preciso y programar envío si corresponde. El reintento conserva identidad para no duplicar la consulta.

Antes de T36 se implementará la transacción con entidad/revisión/cola, sin afirmar que hay snapshot completo. Después de T36, la falta de espacio o un fallo al generar el snapshot lógico debe hacer fallar la transacción, no permitir un guardado silencioso sin esa protección.

### Configuración y concurrencia propuestas

WAL con synchronous=FULL y FK activadas por conexión, sujetos a compatibilidad de la librería seleccionada. Definir espera controlada por bloqueo y serializar escrituras del proceso principal. No hacer bucles infinitos ante SQLITE_BUSY, disco lleno o permisos denegados.

No desactivar sincronización a disco para mejorar una medición. La durabilidad depende también del sistema de archivos y hardware; las pruebas de proceso terminado no equivalen por sí mismas a cortar físicamente la energía.

La recepción de cambios también es transaccional: versiones recibidas, estado local y cursor se aplican juntos. Un cambio recibido no vuelve a entrar en la cola como edición nueva. Si existe una revisión local pendiente, se conserva y se concilia, no se reemplaza por una copia remota sin evaluación.

## Snapshot por guardado de consulta

### Representación lógica

Contenido canónico versionado del expediente del paciente al momento del guardado: identificación mínima, propietario referenciado, consulta y revisiones clínicas relacionadas presentes en la copia local, incluido carnet/seguimiento que corresponda. No se entiende como una imagen de todos los datos de la clínica.

| Dato | Propósito |
| --- | --- |
| snapshot_id y version_formato | Identidad y compatibilidad del contenido |
| paciente_id, consulta_id, revision_id y operacion_id | Asociar exactamente el estado protegido con el guardado |
| ámbito y cuenta/dispositivo de origen | Evitar restauración de datos ajenos o contra otro entorno |
| fecha_creacion y fecha_clinica | Separar instante técnico y atención |
| entidades y revisiones necesarias | Reconstruir el contexto sin crear referencias huérfanas |
| identidad y estado de operaciones referenciadas | Conservar origen y reconocer pendientes al recuperar |
| checksum del contenido canónico | Comprobar consistencia de lectura |

No incluir contraseñas, tokens, sesiones, permisos firmados offline, claves privadas o secretos de proveedor. Un snapshot clínico no restaura la autorización de su autor ni concede acceso a quien lo copie.

### Copia independiente y estados

El snapshot lógico se guarda en SQLite en la transacción clínica; luego se escribe una copia independiente en el directorio de snapshots de la instalación. Usar archivo temporal con identificador no reutilizable, escritura y vaciado mediante mecanismos soportados, validación del contenido y publicación del archivo final. No sobrescribir un snapshot anterior con el mismo nombre.

Estados propuestos: `logico_confirmado`, `copia_pendiente`, `copia_verificada`, `copia_fallida`. La cola de materialización debe poder reconstruirse tras un cierre: si SQLite confirma el snapshot lógico pero no existe su copia verificada, reintentar sin repetir el evento clínico.

El guardado puede haber confirmado en SQLite y fallar la copia independiente. En ese caso mostrar “Consulta guardada localmente; copia de recuperación pendiente”, no “No se guardó” ni “Protección completa”. Conservar el snapshot lógico, registrar el fallo y tratarlo como defecto de recuperación hasta resolverlo. El criterio de protección completa exige que ambas representaciones necesarias estén verificadas.

Un archivo temporal o huérfano no acredita un guardado clínico confirmado. Si no se puede contrastar con la base y las operaciones, presentar una recuperación manual con procedencia incierta; nunca reproducirlo automáticamente como una nueva atención.

### Límites

Dos copias en el mismo disco no protegen contra pérdida total del dispositivo. La réplica central protege solo lo ya confirmado en servidor. Para uso real hace falta destino de respaldo independiente, capacidad, acceso y política de retención acordados; no se presenta un archivo vecino como garantía de cero pérdida ante cualquier desastre.

## Respaldo completo de SQLite

Utilizar la API de backup consistente de la librería SQLite o un mecanismo oficialmente soportado y comprobado. No copiar únicamente el archivo principal mientras hay escrituras o contenido pendiente en WAL. No borrar los archivos WAL/SHM para intentar reparar la base.

Propuesta de frecuencia: al iniciar si no hay una copia verificada del día, antes de una migración/restauración y al cierre normal cuando existan cambios desde el último respaldo. Si la copia completa se retrasa, los snapshots por guardado siguen su propio mecanismo, sin confundir frecuencias.

Generar en destino temporal, abrir la copia de forma aislada, ejecutar integridad y comprobar FK por separado, validar conteos/revisiones/cola y publicar con manifiesto solo si pasa. La apertura de la copia para pruebas no la convierte en base operativa ni debe disparar sincronización.

Los metadatos de sesión, tokens y autorización offline no deben recuperarse desde un respaldo antiguo como autoridad. Tras una recuperación completa se invalida el material de autenticación copiado y se requiere habilitación actual conforme a T12. Proteger también el respaldo frente a acceso de otras cuentas Windows.

## Respaldo de MariaDB central

La API PHP registra entidad, revisión, reconocimiento de operación y cambio publicable en una transacción. Las copias centrales son un proceso administrativo separado de esas invocaciones; no se guardan en el disco temporal de Vercel ni se ejecuta un respaldo completo dentro de cada solicitud clínica.

Plan para la demostración: comprobar el mecanismo y la retención disponibles en el proveedor; realizar una exportación consistente antes de migraciones y de la entrega. Antes de afirmar que existe respaldo periódico, verificar que se ejecuta, que se puede descargar de forma protegida y que es restaurable en una base separada. No depender de un nombre comercial o de una copia anunciada por el proveedor como evidencia suficiente.

La exportación debe incluir entidades clínicas, versiones, conflictos y registro durable de operaciones. Conservar o reconciliar identidades de operación es esencial: perder ese registro puede duplicar operaciones que un cliente vuelva a enviar. Las credenciales de operación y los tokens de sesión requieren tratamiento separado y no se entregan como archivos públicos.

Si se restaura una base central antigua, emitir una nueva época de sincronización y obligar a reconciliar clientes: no reutilizar sin más sus cursores ni simular continuidad del feed anterior. Preservar operaciones locales y cruzarlas por ID con lo recuperado antes de reenviar.

## Retención y capacidad propuestas

| Material | Política candidata |
| --- | --- |
| Versiones clínicas y conflictos | Sin eliminación irreversible automática dentro del alcance del proyecto |
| Snapshots de consultas con pendientes o conflictos | Conservar; no depurar para liberar espacio silenciosamente |
| Copias independientes de snapshots | Sin purga automática inicial; medir tamaño y advertir capacidad insuficiente |
| Respaldos locales completos | Propuesta: últimos siete diarios verificados y conservar el previo a migración hasta comprobar recuperación y estabilidad |
| Respaldos centrales | Según capacidad comprobada del servicio y exportación protegida antes de cambios/entrega; no hay retención garantizada aún |
| Temporales incompletos | Marcar y revisar; retirar solo después de verificar que no son la única evidencia de una operación |

Estas son reglas técnicas candidatas para la revisión T14, no periodos legales. Antes de depurar una copia, comprobar una alternativa válida y que no contiene pendientes únicos. La falta de espacio requiere aviso y suspensión de operaciones que no puedan persistirse con seguridad; no borrar historia clínica o pendientes automáticamente.

## Restauración de un expediente

1. Verificar identidad actual y permiso de restaurar; pedir desbloqueo reciente según T12.
2. Abrir el snapshot como dato inerte: comprobar versión, tamaño, huella, estructura, ámbito e IDs. No ejecutar código o SQL incluido en el archivo.
3. Comparar con el expediente actual y mostrar fecha, revisión, autoría, diferencias y pendientes afectados. Hacer copia de seguridad previa.
4. Confirmar la operación explícitamente. Si existe revisión posterior, advertir y conservarla; no sustituir silenciosamente el archivo de la base.
5. Crear una nueva revisión con origen en el snapshot y autor actual, conservando la autoría histórica. Referencias externas deben existir o conciliarse antes de aplicar.
6. Guardar mediante la misma transacción y cola, con nueva operación de restauración identificada; sincronizar como cambio autorizado, no como sustitución directa de MariaDB.
7. Verificar lectura del resultado y registrar evidencia. Un conflicto remoto se procesa con la política vigente, no se anula por llamarse restauración.

No reiniciar el cursor, sesiones o cola general al restaurar un solo expediente. No cambiar IDs clínicos para “hacer que entre” una copia: eso produciría duplicados y relaciones incorrectas.

## Recuperación de una instalación completa

1. Detener escrituras y sincronización; preservar base afectada, WAL y evidencia, sin borrarlos.
2. Obtener una copia consistente si aún es posible; examinar una copia, no ensayar reparaciones destructivas sobre el único original.
3. Seleccionar respaldo verificado, restaurarlo en ruta temporal aislada y comprobar esquema, integridad, FK, entidades, revisiones y operaciones.
4. Conciliar pendientes posteriores mediante snapshots/revisiones disponibles; distinguir operaciones ya confirmadas por el servidor de las nunca enviadas.
5. Revalidar permisos actuales y establecer el cursor/época de sincronización adecuados antes de retomar el intercambio. Una copia clínica vieja no reactiva credenciales.
6. Confirmar cambio de instalación operativa, conservar la anterior y registrar qué fue recuperado, qué queda incierto y el resultado de las verificaciones.

Si no se puede demostrar que un registro fue confirmado, conservarlo como material de conciliación con procedencia explícita; no inventar éxito ni destruirlo. El objetivo de cero pérdida se verifica para los escenarios definidos, no se extrapola a disco destruido sin copia externa.

## Migraciones y actualizaciones

Versionar esquemas por motor, comprobar compatibilidad antes de escribir y obtener respaldo previo verificado. En SQLite, aplicar cambios transaccionales cuando el motor y la migración lo permitan; para MariaDB evaluar las operaciones DDL concretas, sin suponer rollback de cualquier cambio.

No ejecutar un instalador que borre el directorio de datos ni una migración destructiva automática. Un rollback de aplicación no significa restaurar una base antigua sobre cambios nuevos. Si la nueva versión no puede interpretar el esquema, detener escrituras con explicación y mantener la evidencia para recuperación controlada.

## Verificación prevista de recuperación

Subcasos de ES-06/ES-09/M06 y soporte a ES-07/ES-08/ES-14; todos pendientes de implementación y ejecución.

| ID | Falla o acción | Evidencia exigida |
| --- | --- | --- |
| REC-01 | Cierre antes del commit local | Sin confirmación de éxito ni evento parcial |
| REC-02 | Cierre después del commit y antes del envío | Consulta, revisión, snapshot lógico y pendiente recuperables |
| REC-03 | Falla al generar snapshot lógico | Transacción no confirmada; captura preservada en UI mientras sea posible |
| REC-04 | Falla de la copia independiente tras guardar | Advertencia precisa; snapshot lógico conservado y materialización reintentable sin duplicar consulta |
| REC-05 | Cierre durante escritura de archivo temporal | Temporal no se ofrece como snapshot verificado |
| REC-06 | Respaldo con actividad WAL | Copia consistente incluye transacciones confirmadas del punto respaldado |
| REC-07 | Archivo de snapshot modificado o incompleto | Rechazo de validación sin alterar expediente |
| REC-08 | Restaurar versión anterior con edición posterior | Comparación, confirmación y conservación de ambas revisiones |
| REC-09 | Restaurar expediente con pendientes | Cola y autoría preservadas; sin falso estado sincronizado |
| REC-10 | Snapshot de otra cuenta/ámbito | Acceso denegado y datos actuales sin cambios |
| REC-11 | Recuperación completa desde respaldo antiguo | Permisos no reactivados; operaciones y cursores conciliados |
| REC-12 | Error de integridad o FK en copia | Copia no promovida a operativa; reporte diferenciado |
| REC-13 | Espacio insuficiente | Sin pérdida ni purga silenciosa; resultado de guardado inequívoco |
| REC-14 | Reintento tras respuesta perdida de servidor | Operación reconocida sin duplicar datos |
| REC-15 | Migración fallida | Original/respaldo conservados y resultado explícito; sin esquema parcialmente declarado válido |
| REC-16 | Recuperación central a punto anterior | Nueva época o reconciliación equivalente; clientes no saltan cambios por cursores viejos |

Registrar versión de aplicación/esquema, datos ficticios de entrada, punto de fallo, revisiones/operaciones esperadas y obtenidas, resultado de integridad y limitaciones. Terminar el proceso de la app prueba un cierre inesperado, no una garantía de resistencia a cualquier fallo físico de energía.

## Responsables y ejecución posterior

PC diseña guardado y recuperación en T13 y las relaciones con sincronización. OD implementa copias y recuperación en T36/T37 y las verifica en T47; PC conserva T25 según acuerdo del usuario. BG revisa casos y evidencia; DA coordina la revisión y la versión de entrega. No se redistribuyen las tareas por describir sus dependencias.

T16 prepara la persistencia local; T18 la central; T23/T25 el guardado clínico y offline; T32/T34/T35 la cola e intercambio/conflictos. Antes de H5 se exige evidencia de recuperación crítica completa; T13 por sí sola no habilita declarar ese resultado.

## Referencias técnicas

- [SQLite — PRAGMA](https://sqlite.org/pragma.html): synchronous, integridad y verificación separada de FK.
- [SQLite — Online Backup API](https://sqlite.org/backup.html): respaldo consistente de una base activa.
- [SQLite — WAL](https://sqlite.org/wal.html): relación entre base principal y contenido del log.

Los mecanismos se comprobarán con la librería y versión seleccionadas; las frecuencias, retención y estados son propuestas de VetCare. No se atribuyen a SQLite requisitos específicos del proyecto.

## Cierre y siguiente tarea

- [x] Separar transacción, versiones, snapshots, respaldos y sincronización.
- [x] Definir guardado y estados ante fallas parciales.
- [x] Diseñar restauración por expediente y recuperación completa sin sobrescritura silenciosa.
- [x] Conservar pendientes y excluir recuperación de permisos antiguos.
- [x] Proponer retención, migraciones y 16 casos de verificación.
- [x] Respetar responsable, fechas y alcance del ajuste H3/T36/H5.
- [ ] Implementar mecanismos y ejecutar escenarios en sus tareas correspondientes.

Resultado: T13 preparada como diseño técnico, no respaldo o recuperación ejecutados.

Siguiente tarea: T14 — Revisar y aprobar el diseño general del sistema (H2); responsable Diego Alonso Coronel Vargas; ventana documental del 21 al 23 de septiembre de 2026.
