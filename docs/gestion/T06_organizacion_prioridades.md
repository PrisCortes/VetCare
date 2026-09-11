# T6 — Organizar y priorizar las actividades del proyecto

## Identificación

| Dato | Valor |
| --- | --- |
| Fase / paquete | 2.0 — Planeación y requerimientos / 2.1 — Levantamiento |
| Responsable documental | Brandon García Ordaz (BG) |
| Inicio previsto | 9 de septiembre de 2026 |
| Fin previsto | 11 de septiembre de 2026 |
| Preparación del registro | 18 de noviembre de 2026 |
| Estado | Organización candidata preparada; requisitos pendientes de aprobación en T7 |

Las fechas previstas corresponden al cronograma y no acreditan ejecución histórica. La organización siguiente no modifica las fechas ni sustituye el archivo Microsoft Project.

## Objetivo, fuentes y reglas

Organizar las 52 actividades en entregas verificables, priorizar la atención de riesgos y dependencias y preservar responsables e hitos. Fuentes: Fechas_cronograma.pdf v2.0, VCS-RES-002 v2.0, Plan Integrador Maestro v2.1, Diccionario_EDT.pdf, alcance, plan de calidad y acuerdos del usuario. Insumos locales: [T1](T01_revision_documental.md), [T2](T02_participantes_necesidades.md), [T3](T03_revision_formatos_medicos.md), [T4](T04_proceso_atencion.md) y [T5](T05_funciones_condiciones.md).

Se conservan los IDs T1–T52 y las ventanas del cronograma detallado. T25 se asigna a Priscila por instrucción expresa del usuario; T43 permanece a cargo de Brandon. Las demás asignaciones no cambian. Las horas no se usan para decidir el orden de las entregas.

La división por fases utiliza la tabla de recursos: una fase es un agrupador, no una prohibición de solapamiento con otras fases. Por ello T18/T19 pertenecen al segundo núcleo aunque sus ventanas coincidan con actividades del primero. No se mueve una tarea al mes de su agrupador.

## Criterios de prioridad

La prioridad se aplica a la selección del siguiente trabajo habilitado y a su verificación. No cambia fechas ni convierte requisitos obligatorios en opcionales.

| Clase | Uso | Ejemplos |
| --- | --- | --- |
| P0 — Integridad, acceso y puertas de aceptación | Comprobar antes de declarar operativo el flujo afectado; atender fallos bloqueantes primero | Persistencia, permisos, conflictos, recuperación, H1–H7 |
| P1 — Flujo clínico esencial | Implementar una vez disponibles los insumos y verificar con sus casos obligatorios | Propietarios, pacientes, consulta, carnet, web |
| P2 — Soporte y preparación | Realizar en su ventana; si falta el insumo requerido por otra tarea, pasa a ser el bloqueo prioritario | Registro de participantes, herramientas, manual y capacitación |

P2 no significa prescindible. Un manual, entorno o formato requerido para una entrega sigue siendo condición para cerrarla. La secuencia de esta fase de levantamiento sigue T1–T7 por acuerdo de trabajo; P0 no permite omitir el análisis previo para adelantar artificialmente una aprobación.

## Registro maestro de entregas

Las fechas están en formato día/mes de 2026. Los nombres son resúmenes de las tareas del cronograma; el entregable es una descomposición de trabajo propuesta. La columna de prioridad no proviene de Microsoft Project ni representa una ruta crítica calculada.

### Fase 1.0 — Gestión del proyecto

| ID | Actividad | Responsable | Inicio | Fin | Prioridad | Entregable verificable |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | Revisar documentos y acuerdos | DA | 01/09 | 02/09 | P2 | Registro de fuentes, acuerdos y límites |

### Fase 2.0 — Planeación y requerimientos

| ID | Actividad | Responsable | Inicio | Fin | Prioridad | Entregable verificable |
| --- | --- | --- | --- | --- | --- | --- |
| T2 | Identificar participantes y necesidades | BG | 01/09 | 03/09 | P2 | Registro de interesados y necesidades trazadas |
| T3 | Revisar formatos médicos | BG | 02/09 | 04/09 | P2 | Campos, diferencias con alcance y ambigüedades |
| T4 | Conocer el proceso de atención | BG | 03/09 | 07/09 | P2 | Flujo documentado, variantes y límites de evidencia |
| T5 | Establecer funciones y condiciones | BG | 07/09 | 09/09 | P1 | Especificación candidata RE01–RE22 |
| T6 | Organizar y priorizar actividades | BG | 09/09 | 11/09 | P2 | Este registro de entregas y dependencias propuestas |
| T7 | Obtener aprobación de requisitos, H1 | BG | 11/09 | 14/09 | P0 | Registro de revisión, decisiones y aceptación o pendientes |

### Fase 3.0 — Diseño de arquitectura e interfaz

| ID | Actividad | Responsable | Inicio | Fin | Prioridad | Entregable verificable |
| --- | --- | --- | --- | --- | --- | --- |
| T8 | Definir las partes del sistema | OD | 10/09 | 14/09 | P0 | Arquitectura, límites y contratos entre componentes |
| T9 | Organizar datos de propietarios y pacientes | OD | 11/09 | 16/09 | P0 | Modelo local/central, relaciones e identificadores |
| T10 | Diseñar pantallas de escritorio | DA | 14/09 | 17/09 | P1 | Prototipos de flujos esenciales y estados |
| T11 | Diseñar pantallas móviles | DA | 15/09 | 18/09 | P1 | Prototipos responsivos y adaptación de formularios |
| T12 | Definir acceso y protección | PC | 15/09 | 18/09 | P0 | Permisos, sesión online/offline y controles de seguridad |
| T13 | Planear guardado y recuperación | PC | 16/09 | 21/09 | P0 | Política de persistencia, snapshots y recuperación |
| T14 | Revisar y aprobar diseño, H2 | DA | 21/09 | 23/09 | P0 | Revisión del diseño con decisiones y evidencia |

### Fase 4.0 — Desarrollo del núcleo local

| ID | Actividad | Responsable | Inicio | Fin | Prioridad | Entregable verificable |
| --- | --- | --- | --- | --- | --- | --- |
| T15 | Preparar herramientas y espacios de trabajo | OD | 21/09 | 24/09 | P2 | Entorno reproducible y configuración sin secretos |
| T16 | Preparar almacenamiento local | OD | 24/09 | 30/09 | P0 | SQLite inicial y persistencia tras reinicio |
| T17 | Crear pantallas de escritorio | DA | 24/09 | 02/10 | P1 | Navegación y componentes del flujo de escritorio |
| T20 | Desarrollar propietarios | PC | 30/09 | 06/10 | P1 | Registro, consulta, edición y baja lógica |
| T21 | Desarrollar pacientes | PC | 02/10 | 08/10 | P1 | Pacientes multiespecie vinculados con propietario |
| T22 | Preparar formularios de atención | DA | 02/10 | 08/10 | P1 | Formularios clínicos y mensajes de validación |
| T23 | Desarrollar consultas y tratamientos | PC | 06/10 | 13/10 | P1 | Consultas persistentes con contenido acordado |
| T24 | Desarrollar historial | PC | 09/10 | 15/10 | P1 | Recuperación y presentación de antecedentes |
| T25 | Permitir registro sin internet, H3 | PC | 09/10 | 16/10 | P0 | Persistencia offline, pendientes y reapertura verificadas |
| T36 | Crear copias de seguridad | OD | 20/10 | 29/10 | P0 | Snapshots por guardado y copias verificables |

### Fase 5.0 — Carnet, web e integración

| ID | Actividad | Responsable | Inicio | Fin | Prioridad | Entregable verificable |
| --- | --- | --- | --- | --- | --- | --- |
| T18 | Preparar comunicación con sistema central | PC | 25/09 | 05/10 | P0 | API PHP y conexión segura con MariaDB verificadas |
| T19 | Crear inicio de sesión y permisos | PC | 29/09 | 05/10 | P0 | Autenticación y autorización aplicadas en servidor |
| T27 | Desarrollar vacunas y desparasitaciones | PC | 12/10 | 19/10 | P1 | Eventos sanitarios y próxima fecha opcional |
| T28 | Crear consulta desde móviles | DA | 12/10 | 21/10 | P1 | Web de consulta y captura responsiva |
| T29 | Unir expediente y carnet, H4 | DA | 16/10 | 22/10 | P0 | Historial clínico y sanitario integrados |
| T32 | Organizar pendientes de conexión | PC | 16/10 | 23/10 | P0 | Cola persistente con identidad y estado de operaciones |
| T34 | Enviar y actualizar información | PC | 22/10 | 30/10 | P0 | Intercambio con reintentos idempotentes |
| T35 | Prevenir conflictos de modificación | PC | 26/10 | 03/11 | P0 | LWW, versiones conservadas y desempate verificable |
| T38 | Unir módulos del sistema | DA | 26/10 | 04/11 | P0 | Integración de escritorio, API y web |
| T42 | Confirmar estabilidad, H5 | DA | 09/11 | 09/11 | P0 | Versión congelada y evidencia de criterios H5 |

### Fase 6.0 — Calidad y pruebas operativas

| ID | Actividad | Responsable | Inicio | Fin | Prioridad | Entregable verificable |
| --- | --- | --- | --- | --- | --- | --- |
| T26 | Comprobar funciones básicas | BG | 12/10 | 16/10 | P0 | Casos del núcleo local con resultados y defectos |
| T30 | Preparar pruebas con y sin internet | OD | 12/10 | 16/10 | P2 | Datos ficticios, escenarios y entorno controlado |
| T31 | Primeras pruebas de sincronización | BG | 14/10 | 16/10 | P0 | Evidencia preliminar, identificando mocks y límites |
| T33 | Evaluar intercambio inicial | BG | 19/10 | 23/10 | P0 | Corte M05a con resultados reales y pendientes explícitos |
| T37 | Comprobar recuperación | OD | 29/10 | 05/11 | P0 | Restauraciones aisladas y comprobación de integridad |
| T39 | Revisar permisos y distintos equipos | BG | 02/11 | 06/11 | P0 | Matriz de acceso y compatibilidad ejecutada |
| T40 | Revisar funciones y requisitos | BG | 03/11 | 06/11 | P0 | Revisión funcional y trazabilidad del núcleo |
| T41 | Evaluar sincronización en pruebas | OD | 06/11 | 09/11 | P0 | Staging M05b y evidencia de intercambio crítico |
| T43 | Preparar pruebas con la clínica | BG | 09/11 | 10/11 | P2 | Guion, participantes, equipos y modalidad confirmados |
| T44 | Primera sesión de pruebas | BG | 10/11 | 13/11 | P0 | Resultados de sesión 1, hallazgos y participantes reales |
| T45 | Corregir problemas de sesión 1 | PC | 12/11 | 16/11 | P0 | Correcciones y evidencia de casos repetidos |
| T46 | Segunda sesión de pruebas | BG | 16/11 | 20/11 | P0 | Resultados de sesión 2 y regresión |
| T47 | Comprobar guardado y recuperación en pruebas | OD | 17/11 | 20/11 | P0 | Escenarios de falla y recuperación documentados |
| T48 | Revisión final y cierre, H6 | BG | 20/11 | 23/11 | P0 | Cierre de pruebas, cero bloqueantes y pendientes menores |

### Fase 7.0 — Cierre y entrega

| ID | Actividad | Responsable | Inicio | Fin | Prioridad | Entregable verificable |
| --- | --- | --- | --- | --- | --- | --- |
| T49 | Preparar manual y evidencias | DA | 18/11 | 24/11 | P2 | Manual coherente con versión final y evidencias organizadas |
| T50 | Instalar versión final | OD | 24/11 | 25/11 | P0 | Despliegue y distribución Windows verificados |
| T51 | Explicar uso y verificar aceptación | BG | 25/11 | 26/11 | P2 | Capacitación o demostración y resultados identificados |
| T52 | Entregar y obtener aceptación, H7 | DA | 27/11 | 27/11 | P0 | Entrega, versión y aceptación o pendientes registrados |

DA: Diego Alonso Coronel Vargas. PC: Priscila Cortés Ramírez. OD: Oscar Aarón Delgadillo Fernández. BG: Brandon García Ordaz. La modalidad escolar no autoriza a inventar firmas ni participación clínica.

## Dependencias lógicas para seleccionar una entrega

Las relaciones siguientes son propuestas operativas derivadas del alcance y de los paquetes EDT. No son una extracción de la columna Predecesoras del MPP; no se ha procesado su red ni calculado holguras. “Insumo” puede estar suficientemente definido para comenzar mientras la tarea origen continúa; no todas las relaciones son fin–inicio.

| Trabajo | Insumos para comenzar o avanzar | Condición para declarar terminado |
| --- | --- | --- |
| T7 | T2–T6 y decisiones de T5 registradas | Especificación revisada y aceptación o pendientes explícitos |
| T8/T9 | Alcance y requisitos candidatos T5; revisión T7 cuando corresponda | Diseño coherente con requisitos revisados, sin presentar propuestas como aprobadas |
| T10/T11 | T3/T4, criterios T5 y contratos de diseño disponibles | Pantallas con campos y estados revisados |
| T12/T13 | Modelo T9 y flujos de autenticación/guardado definidos con T8 | Reglas de acceso, offline y recuperación explícitas |
| T14 | T8–T13 | Revisión del conjunto, con decisiones pendientes identificadas |
| T15–T17 | Insumos del diseño; esquema y prototipos estables para la parte que se construye | Entorno ejecutable y almacenamiento/navegación comprobados |
| T18/T19 | Arquitectura, permisos y servicio central accesible | PHP en Vercel, conexión cifrada y permisos verificados |
| T20–T25 | SQLite, modelo, formularios y relación propietario–paciente disponibles | Flujo clínico persistente y casos locales ejecutados |
| T27–T29 | Paciente, API/permisos para web y campos sanitarios acordados | Carnet e historial accesibles e integrados |
| T30/T31 | Contratos de intercambio y datos ficticios | Evidencia diferenciada de mocks frente a integración real |
| T32/T34/T35 | Modelo de versiones, persistencia y API | Reintentos y conflictos sin pérdida o duplicación |
| T36/T37 | Diseño de recuperación y esquema local | Snapshot y restauración aislada comprobados |
| T38–T42 | Módulos y pruebas críticas disponibles | Casos obligatorios conformes, M05b y recuperación; versión identificada |
| T43–T48 | Versión de prueba estable, guiones y participantes disponibles | Resultados reales, regresión y cero bloqueantes al cierre |
| T49–T52 | Versión estable, pruebas y evidencia organizada | Manual, instalación/demostración y aceptación identificados |

Las pruebas T31 pueden usar contratos simulados antes de terminar T32/T34/T35; no acreditan por sí mismas sincronización real completa. T33 precede al fin de esas implementaciones: cualquier caso aún no ejecutable se informa como pendiente, sin cambiar las fechas ni declarar un porcentaje inventado.

## Orden de trabajo y resolución de solapamientos

1. Terminar el registro T6 y preparar T7 como revisión de requisitos, dejando las decisiones abiertas visibles.
2. Continuar con T8 y T9 para arquitectura y datos una vez estén definidos los insumos que afecten cada parte.
3. Preparar T10–T14 con prototipos, acceso, guardado y revisión de diseño.
4. Implementar T15 en adelante seleccionando tareas habilitadas. Cuando fechas se solapen, priorizar insumos técnicos comunes y trabajar por interfaces estables.
5. Presentar una tarea por entrega; si una integración exige un cambio de otra tarea, identificarlo expresamente y no atribuirlo al responsable equivocado.

El orden de presentación al usuario no cambia las ventanas históricas. Por ejemplo, T8 comienza antes de terminar T7 en el cronograma; puede diseñarse sobre una versión candidata con cambios controlados, sin fingir que H1 ocurrió antes. Del mismo modo T15 se solapa con T14: la preparación del entorno puede adelantarse, pero su revisión no se declara aprobada antes de contar con evidencia.

No se deriva una ruta crítica solo por ordenar las tareas. Si durante implementación aparece una incompatibilidad entre dependencia y fecha, se registra para resolverla con el usuario y se mantiene la línea base documental hasta una decisión expresa.

## Puertas de aceptación y riesgos que priorizan verificaciones

| Puerta | Fecha 2026 | Verificaciones que no se omiten |
| --- | --- | --- |
| H1 / T7 | 14/09 | Requisitos y decisiones con estado conocido; no inventar aprobación clínica |
| H2 / T14 | 23/09 | Diseño, modelo, permisos y recuperación revisados |
| H3 / T25 | 16/10 | Captura local y persistencia; snapshots no se acreditan todavía como completos |
| H4 / T29 | 22/10 | Carnet e historial integrados y acceso web revisado |
| H5 / T42 | 09/11 | Núcleo obligatorio conforme, staging M05b y restauración verificada antes de congelar |
| H6 / T48 | 23/11 | Casos, regresión, trazabilidad y cero bloqueantes |
| H7 / T52 | 27/11 | Versión final, manual, despliegue y aceptación con sus límites documentados |

R1/R3/R11 justifican atender primero fallos de integridad, recuperación y acceso, incluso con baja probabilidad estimada. R2/R12 exigen guiones utilizables y participantes confirmados. R4/R7 requieren registrar bloqueos y decisiones. R6/R9 se verifican mediante criterio individual menor a 30 s y uso consistente del cronograma vigente. Las respuestas escritas no cierran riesgos ni prueban su eficacia.

## Política de entregas y commits

Cada entrega debe identificar tarea, responsable, fechas documentales, archivos, verificación realizada, limitaciones y mensaje de commit sugerido. Los responsables documentales no se convierten automáticamente en autores Git por escribir su nombre en un documento.

El usuario realiza commits y define su historial. El asistente no cambia fechas, identidades, ramas remotas ni publica versiones por esta tarea. No se incluyen credenciales o datos clínicos reales. Los archivos de cada tarea se separan; cambios transversales, como el índice README, se explican.

Una tarea está “preparada” cuando existe su entregable revisable. “Verificada” exige una comprobación adecuada al tipo de trabajo. “Aprobada” exige una decisión identificable; “implementada” y “probada” no se usan para documentos de planificación. Si existe una dependencia bloqueada, se puede continuar trabajo independiente sin fingir su resolución.

## Estado de decisiones y restricciones actuales

| Elemento | Estado | Consecuencia |
| --- | --- | --- |
| D-T5-01: aplicación, seguimiento y eventos independientes | Pendiente de confirmación | No cerrar relaciones de datos ni formularios definitivos sobre una aprobación supuesta |
| D-T5-02: mínimos y opcionales de captura | Pendiente de confirmación | Mantener candidata la matriz de validación |
| D-T5-03: unidades, edad y fechas | Pendiente de confirmación | No afirmar aprobación clínica de validaciones |
| Vercel/PHP y conexión cifrada a MariaDB | Diseño propuesto, sin prueba técnica todavía | Verificación prioritaria en preparación e implementación de comunicación |
| Validación clínica real | No acreditada; demostración escolar acordada | Etiquetar simulaciones y registrar participantes reales |

Este registro de prioridades no constituye respuesta a las preguntas de T5. La instrucción de continuar autoriza preparar T6, sin interpretar silencio como aceptación de esos detalles.

## Criterios de cierre y siguiente tarea

- [x] Organizar las 52 tareas sin omisiones ni IDs duplicados.
- [x] Conservar fechas y responsables, con T25 de PC y T43 de BG.
- [x] Asignar prioridad propuesta y entregable comprobable a cada tarea.
- [x] Distinguir dependencias lógicas propuestas de la red oficial de Microsoft Project.
- [x] Identificar solapamientos, puertas de aceptación y condiciones de prueba.
- [x] Mantener pendientes de T5 y límites de evidencia.
- [x] Definir entregas por tarea y commits a cargo del usuario.

Resultado: T6 preparada como organización candidata del trabajo; no se ha reprogramado el proyecto ni aprobado automáticamente la especificación.

Siguiente tarea: T7 — Obtener la aprobación de los requisitos (H1); responsable Brandon García Ordaz; ventana documental del 11 al 14 de septiembre de 2026. Se preparará el paquete de revisión y se registrará el resultado real, sin inventar firmas ni una aprobación no recibida.
