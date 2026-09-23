# T14 — Revisar y aprobar el diseño general del sistema (H2)

## Identificación y dictamen

| Dato | Valor |
| --- | --- |
| Fase | 3.0 — Diseño de arquitectura e interfaz |
| Responsable documental | Diego Alonso Coronel Vargas (DA) |
| Inicio previsto | 21 de septiembre de 2026 |
| Fin previsto / hito | 23 de septiembre de 2026 / H2 |
| Preparación del registro | 18 de noviembre de 2026 |
| Resultado | Revisión documental completada con observaciones; aprobación formal y validación técnica pendientes |

Las fechas previstas se conservan del cronograma. No se acredita reunión, firma ni aprobación histórica por emitir este informe. La revisión no equivale a desplegar el sistema ni a comprobar funciones aún no implementadas.

Dictamen técnico de trabajo: el diseño es suficientemente definido para preparar el entorno T15 y realizar pruebas de viabilidad; no se detectó incompatibilidad documental que obligue a cambiar el stack. Esto no prueba compatibilidad real de proveedores ni concede aprobación de requisitos o aceptación clínica.

## Material revisado

| Entregable | Área examinada |
| --- | --- |
| [T5 — Especificación candidata](../gestion/T05_funciones_condiciones.md) | Funciones, criterios y decisiones de captura |
| [T7 — Paquete de requisitos](../gestion/T07_revision_aprobacion_requisitos.md) | Autoridad y decisiones pendientes |
| [T8 — Arquitectura](T08_arquitectura_sistema.md) | Componentes, contratos, fronteras y ambientes |
| [T9 — Modelo lógico](T09_modelo_datos.md) | Entidades, claves, conservación e intercambio |
| [T10 — Escritorio](../diseno/T10_pantallas_escritorio.md) | Pantallas, interacción de ejemplo y límites |
| [T11 — Móvil](../diseno/T11_pantallas_moviles.md) | Adaptación de listados, formularios y contexto del paciente |
| [T12 — Acceso](T12_acceso_proteccion.md) | Roles, sesión, offline, revocación y autoría |
| [T13 — Recuperación](T13_guardado_recuperacion.md) | Transacciones, snapshots, copias y restauración |

También se contrastan las ventanas y responsables de T6, alcance, EDT y criterios de calidad ya identificados. La revisión utiliza los archivos presentes en el repositorio; no modifica los PDF originales ni los commits realizados por el usuario.

## Coherencia de extremo a extremo

| Recorrido | Comprobación documental | Resultado |
| --- | --- | --- |
| Propietario → paciente → consulta | Referencias estables y FK; UI selecciona paciente existente | Coherente; mínimos de captura candidatos |
| Consulta → revisión → pendiente | T9/T13 exigen persistencia conjunta y operación identificada | Coherente como diseño; falta implementar |
| Pendiente → API → central | T8/T9 separan usuario/dispositivo, operación y versión; T12 revalida permiso | Coherente; proveedor y sesión por comprobar |
| Central → cambios → copia local | Cursor y aplicación transaccional; no reenviar cambios recibidos | Coherente; publicación concurrente requiere prueba específica |
| Conflicto → versiones conservadas | LWW con revisión base e historial; resolución crea otra revisión | Coherente; desempate definitivo se concreta en T35 |
| Consulta → snapshot → restauración | T13 distingue lógico confirmado, copia independiente y resultado de recuperación | Coherente; no confundir copia pendiente con protección completa |
| Usuario revocado → cola pendiente | T12 bloquea intercambio y conserva autoría/datos | Coherente; no reetiquetar con credenciales de otra cuenta |
| Móvil → expediente/carnet | T11 conserva identificación y próxima fecha opcional | Coherente como intención; verificación visual pendiente |
| H3 → T36 → H5 | Captura offline primero; snapshots completos después de T36 y verificados antes de H5 | Respeta el ajuste expreso del usuario |

## Hallazgos y condiciones para implementación

Prioridad crítica: bloquea declarar viable u operativo el componente afectado. Alta: debe concretarse o verificarse antes de cerrar su implementación. Media: debe tratarse antes de la revisión de interfaz o de la entrega a la que afecta. No son porcentajes ni resultados medidos.

| ID | Prioridad | Hallazgo | Tratamiento / momento | Responsable documental de ejecución |
| --- | --- | --- | --- | --- |
| DIS-01 | Crítica | PHP en Vercel y acceso cifrado externo a MariaDB siguen sin prueba real | Prueba mínima de runtime en preparación y conexión en T18; no cambiar motor/lenguaje sin informar | OD en preparación; PC en T18 |
| DIS-02 | Alta | D-T5-01/02/03 no tienen decisión expresa registrada | Mantener relaciones, mínimos y unidades como candidatos; resolver antes de formularios/esquema definitivos | BG coordina requisitos; usuario decide para demo |
| DIS-03 | Alta | T12 precisa separación local por cuenta, vigencias y desbloqueo, más allá del resumen T9 | Incorporar separación y metadatos en migraciones y adaptador local; no replicar hashes o sesiones web | OD en almacenamiento; PC en permisos |
| DIS-04 | Alta | No existe transacción única entre SQLite y archivo externo de snapshot | Aplicar diseño T13: snapshot lógico transaccional y materialización independiente recuperable, con estados explícitos | OD en T36/T37 |
| DIS-05 | Alta | Secuencia central puede saltar cambios si confirma fuera de orden | Probar publicación serializada o estrategia equivalente antes de validar recepción por cursor | PC en T34; OD/BG en pruebas |
| DIS-06 | Alta | Un respaldo central antiguo puede invalidar cursores y deduplicación | Nueva época o reconciliación probada; conservar identidad de operaciones y cola local | OD en recuperación; PC en sincronización |
| DIS-07 | Alta | Revocación remota no se conoce offline inmediatamente | Vigencia limitada, comprobación de reloj y bloqueo al recibir revocación; conservar datos pendientes | PC en T19/T25 y sincronización |
| DIS-08 | Alta | Prototipos no tienen revisión visual ni interacción real acreditadas por bloqueo de sesión de navegador | Ejecutar guiones T10/T11 al disponer de navegador de revisión; no presentar CSS/sintaxis como prueba visual | DA en revisión e implementación de interfaz |
| DIS-09 | Media | El prototipo no representa todos los campos opcionales del paciente ni CRUD completo | Implementar edad/nacimiento, edición/baja y validaciones según decisiones; no copiar la maqueta como módulo terminado | DA/PC en tareas de interfaz y pacientes |
| DIS-10 | Media | Fecha de formulario, estados y eventos del prototipo son datos fijos ficticios | Sustituir por fecha contextual, resultados del adaptador y eventos reales al implementar | DA/PC según módulo |
| DIS-11 | Alta | El diseño de guardado de T8 es general; T13 precisa éxito local frente a copia fallida | T13 es la precisión de referencia: mostrar guardado confirmado y protección pendiente como estados distintos | PC/OD en guardado y snapshots |
| DIS-12 | Media | El prototipo confirma descarte con Cancelar, pero no acredita protección integral al navegar/recargar | En implementación, detectar captura modificada, advertir al salir y comprobar navegación atrás/recarga; no prometer protección que no se haya ejecutado | DA en T17/T22/T28 |

No se cierran hallazgos mediante este informe. Cada uno requiere evidencia o decisión en su tarea. El responsable documental no implica que el usuario deba programarlo: el asistente realizará el trabajo de implementación autorizado y el usuario gestionará los commits.

## Precisiones de diseño resultantes

1. Conservar el stack acordado: interfaz HTML/CSS/JS, API PHP en Vercel, MariaDB central propuesta, SQLite y Electron para Windows. No introducir un framework, base o proveedor alternativo como solución implícita a un fallo aún no comprobado.
2. Separar tres resultados visibles: persistencia local confirmada, copia independiente verificada y sincronización central confirmada. Ninguno demuestra los otros dos.
3. La cola conserva el autor y su ámbito. Cambiar de cuenta no transfiere pendientes, no revoca historia y no concede permiso para enviarlos con otra identidad.
4. La restauración clínica genera una nueva revisión; recuperar una instalación completa requiere reconciliar permisos, operaciones y cursores antes de sincronizar.
5. La UI del prototipo es referencia de diseño. El renderizador final no recibe secretos, no ejecuta SQL y no implementa permisos solo ocultando botones.
6. D-T5-01/02/03 quedan abiertas. El trabajo independiente puede avanzar; no ejecutar una migración definitiva o cerrar un formulario suponiendo aprobación por silencio.
7. Las reglas técnicas de T12/T13 son candidatas revisables, no firma clínica. Cambios materiales se documentan antes de implementar su comportamiento.

Estas precisiones no alteran fechas o responsables. No se elimina la necesidad de evidencia de H1/H2 por su solapamiento con tareas técnicas.

## Puerta para T15 y siguientes

| Se puede preparar en T15 | No se declara conseguido por hacerlo |
| --- | --- |
| Estructura del proyecto y comandos de ejecución | Aplicación clínica completa |
| Dependencias necesarias y versiones verificadas | Compatibilidad universal o ausencia de vulnerabilidades |
| Configuración de desarrollo sin secretos y ejemplos de variables | Cuentas de proveedores creadas o permisos concedidos |
| Entrada mínima web/Electron/PHP y diagnósticos locales | Despliegue real en Vercel o conexión real a MariaDB |
| Validaciones de entorno y comprobaciones básicas | Persistencia clínica, sincronización o restauración implementadas |

T16 prepara almacenamiento local; T17 pantallas ejecutables de escritorio; T18 comunicación central; T19 autenticación. Esa secuencia no significa que T15 deba entregar todos esos módulos. Las fechas y asignaciones continúan siendo las del cronograma, incluso cuando se solapan.

## Evidencia de esta revisión

- Presencia de los entregables y recursos de diseño referenciados.
- Comprobación de enlaces locales de documentos y recursos del prototipo.
- Comprobación de sintaxis de app.js del prototipo, distinta de ejecución de sus flujos.
- Registro explícito de hallazgos, límites y tareas de resolución.

No se ejecutaron pruebas contra SQLite/MariaDB ni autenticación, recuperación o sincronización reales. La verificación visual móvil/escritorio continúa pendiente y no se declara subsanada por volver a revisar archivos. No se atribuyen reuniones, resultados M06/M13, firma de CN o aprobación académica a esta revisión documental.

## Registro de decisión

| Ámbito | Resultado actual |
| --- | --- |
| Revisión técnica documental | Completada con observaciones; diseño suficiente para preparación del entorno y comprobaciones de viabilidad |
| Aprobación de requisitos T7 | Pendiente; incluye D-T5-01/02/03 |
| Revisión personal de DA/BG/PC/OD | No acreditada por escribir sus nombres en los entregables |
| Aprobación del usuario del diseño visual | No hay decisión específica registrada |
| Validación clínica por CN | Pendiente |
| Aprobación académica por ER | Pendiente |
| Cumplimiento formal de H2 | No se declara acreditado sin las decisiones y evidencias correspondientes |

La continuidad de tareas autorizada por el usuario permite preparar T15. No equivale a una firma de los participantes ni a conformidad expresa con cada decisión clínica pendiente. Cualquier aprobación posterior se registra con su alcance y fecha reales.

## Criterios de cierre y siguiente tarea

- [x] Reunir y contrastar arquitectura, datos, pantallas, acceso y recuperación.
- [x] Revisar coherencia con requisitos, exclusiones y fechas acordadas.
- [x] Identificar hallazgos, prioridad y tarea de resolución.
- [x] Delimitar qué puede prepararse en T15 y qué exige comprobación posterior.
- [x] Mantener separadas revisión técnica, aprobación de diseño y validación clínica.
- [ ] Ejecutar revisión visual y pruebas técnicas pendientes.
- [ ] Registrar aceptación del diseño y decisiones de requisitos cuando se reciban.

Resultado: T14 entregada como revisión documental con observaciones. La aprobación formal de H2 permanece pendiente; no se bloquea la preparación técnica independiente.

Siguiente tarea: T15 — Preparar las herramientas y espacios de trabajo; responsable Oscar Aarón Delgadillo Fernández; ventana documental del 21 al 24 de septiembre de 2026. Comienza la preparación ejecutable del proyecto, sin crear commits automáticamente.
