# T4 — Conocer el proceso de atención de los veterinarios

## Identificación

| Dato | Valor |
| --- | --- |
| Fase / paquete | 2.0 — Planeación y requerimientos / 2.1 — Levantamiento |
| Responsable documental | Brandon García Ordaz (BG) |
| Inicio previsto | 3 de septiembre de 2026 |
| Fin previsto | 7 de septiembre de 2026 |
| Preparación del registro | 18 de noviembre de 2026 |
| Estado | Proceso documental propuesto; pendiente de validación operativa |

Las fechas previstas son las del cronograma. No se acredita observación presencial, entrevista ni ejecución histórica. La tarea entrega el análisis posible con la evidencia disponible; conocer el proceso real exige contrastarlo con los médicos.

## Objetivo y fuentes

Describir cómo se identifica al paciente, se consulta su historial y se registra la atención, el seguimiento y el carnet. Sirve de entrada a T5 (funciones y condiciones) y T6 (priorización), sin agregar módulos excluidos.

Fuentes: Charter_v3.pdf (necesidad de negocio y reglas), Declaracion_del_Alcance.pdf (RE01–RE16 y exclusiones), Diccionario_EDT.pdf (expediente y carnet), Plan_Gestion_Calidad.pdf (ES-01–ES-16), cronograma detallado y registros [T1](T01_revision_documental.md), [T2](T02_participantes_necesidades.md) y [T3](T03_revision_formatos_medicos.md). Se incorporan las aclaraciones del usuario sobre roles, próxima aplicación opcional, Windows, acceso web y modalidad escolar.

## Evidencia y límites del proceso actual

| Situación | Sustento | Nivel de certeza |
| --- | --- | --- |
| Se utilizan hojas clínicas y carnets físicos | Fotografías aportadas y contexto del charter | Documentado |
| La hoja identifica propietario y paciente y registra mediciones, diagnóstico y tratamiento | Revisión T3 | Observado en formato vacío |
| Hay filas de seguimiento y registros de vacunas y desparasitación | Revisión T3 | Observado en formato vacío |
| La atención puede requerir consulta del historial y trabajo con internet intermitente | Alcance y charter | Necesidad documentada |
| El veterinario decide si indica próxima fecha | Aclaración del usuario | Confirmado por el usuario |
| La búsqueda del historial precede a la atención y el registro se completa al terminar | Secuencia propuesta para digitalizar | Inferencia por validar |
| Existen recepción formal, turnos, cobros o agenda | Sin evidencia suficiente para definirlos aquí | No se incorporan al flujo |

No se conoce la secuencia real de escritura, quién archiva el papel, cómo identifica homónimos la clínica ni cómo corrige una anotación. No se afirma que el papel tenga un método de respaldo ni que las pruebas de campo ya hayan ocurrido.

## Actores y responsabilidades operativas

| Actor | Participación |
| --- | --- |
| Veterinario | Identificar al paciente, revisar antecedentes, registrar la atención y decidir próxima aplicación |
| Propietario del animal | Aportar identificación y antecedentes a través de la clínica; sin acceso directo al sistema |
| Administrador | Gestionar cuentas y configuración, propuesta pendiente de concretar en T12; no se le asigna autoridad clínica automáticamente |
| Sistema | Validar captura, persistir datos, mostrar historial y recordatorios y gestionar sincronización |
| BG / CN | BG documenta y prepara validación; CN contrasta el flujo clínico. La identidad del segundo médico continúa pendiente |

## Flujo digital propuesto

| Paso | Acción | Resultado esperado | Requisitos |
| --- | --- | --- | --- |
| AT-01 | Acceder con una cuenta autorizada | Sesión y permisos válidos; comportamiento offline por definir en T12 | RE12 |
| AT-02 | Buscar al propietario y al paciente | Seleccionar entidades existentes; no confundir nombres repetidos | RE01, RE02 |
| AT-03 | Registrar al propietario o paciente si no existe | Paciente vinculado con propietario; datos mínimos por definir en T5 | RE01, RE02 |
| AT-04 | Consultar antecedentes | Historial disponible antes de registrar una nueva atención | RE05, RE13 |
| AT-05 | Registrar consulta | Fecha, mediciones disponibles, diagnóstico, tratamiento y notas; sin PA | RE03 |
| AT-06 | Registrar vacunas o desparasitación cuando corresponda | Evento sanitario vinculado con paciente; próxima fecha opcional | RE04 |
| AT-07 | Revisar y guardar | Confirmación de persistencia o error visible; no anunciar éxito antes de guardar | RE03, RE06, RE09 |
| AT-08 | Consultar el resultado y añadir seguimiento cuando corresponda | Atención recuperable y registro cronológico | RE03, RE05 |
| AT-09 | Sincronizar cambios del escritorio cuando exista conexión | Estado verificable; sin pérdida, duplicación ni sobrescritura silenciosa | RE07, RE08, RE14 |

AT-06 es opcional: una consulta no implica vacunar o desparasitar. Tampoco se obliga a crear una consulta vacía para registrar un evento sanitario independiente; esa relación debe concretarse en T5/T9. AT-09 puede ejecutarse automáticamente en paralelo al uso, sin bloquear la captura offline ya autorizada.

La evaluación, el diagnóstico, la indicación terapéutica y las decisiones sanitarias corresponden al veterinario. El sistema registra información; no genera prescripciones, dosis o calendarios clínicos.

## Variantes de atención

| Variante | Flujo propuesto | Límite |
| --- | --- | --- |
| Paciente nuevo | Buscar primero; registrar propietario si falta; registrar paciente; abrir atención | No crear duplicados solo por diferencias de escritura |
| Paciente recurrente | Seleccionar paciente; consultar antecedentes; registrar nueva consulta | No sobrescribir la consulta anterior para representar una visita distinta |
| Aplicación sanitaria sin consulta completa | Seleccionar paciente y registrar el evento, con próxima fecha opcional | Relación con consultas pendiente de T5 |
| Seguimiento | Seleccionar atención o episodio de referencia y registrar fecha, aplicación y observaciones | El vínculo exacto y el significado de “Aplicación” siguen pendientes |
| Captura retrospectiva a demanda | Registrar fecha real del evento y conservar la fecha técnica de captura separada | No representa migración masiva de expedientes |
| Corrección | Abrir registro existente, aplicar cambios autorizados y conservar trazabilidad | Versionado y permisos en T9/T12/T35; sin borrado clínico irreversible |

## Conexión, persistencia y recuperación

| Contexto | Comportamiento esperado |
| --- | --- |
| Escritorio con internet | Persistir en SQLite y sincronizar mediante API; mostrar si el cambio está pendiente o confirmado en servidor |
| Escritorio sin internet | Consultar los datos locales disponibles y capturar cambios; la copia local puede no contener actualizaciones recientes de otros dispositivos |
| Web con internet | Consultar y guardar mediante API; confirmar éxito solo tras respuesta válida del servidor |
| Web sin internet | Informar indisponibilidad de guardado; no simular persistencia offline ni descartar silenciosamente texto capturado. Tratamiento de la pantalla pendiente de diseño |
| Reconexión | Reintentar operaciones identificadas sin duplicarlas; conservar pendientes si el envío falla |
| Conflicto entre dispositivos | Aplicar LWW con historial y desempate determinista; conservar versiones y solicitar revisión si no se resuelve |
| Cierre o falla del escritorio | Conservar cambios ya guardados; restauración y snapshots se prueban en entorno controlado |

La sincronización al cerrar no es la única protección: el guardado local y la cola deben sobrevivir a un cierre inesperado. El diseño de snapshots corresponde a T13/T36 y su evidencia se completa después de T36, antes de H5, según el acuerdo registrado en T1.

## Excepciones y decisiones de interacción

| Situación | Respuesta propuesta |
| --- | --- |
| Propietario o paciente con nombre repetido | Mostrar datos adicionales de identificación; no fusionar automáticamente |
| Fecha de nacimiento desconocida | Permitir representar edad estimada conforme a la política que se acuerde en T5 |
| Medición no tomada | Representar ausencia; no sustituir por cero ni un valor clínico inventado |
| Sin próxima aplicación | Guardar el evento sin recordatorio y mostrar “Sin fecha programada” |
| Error de validación | Identificar campo y motivo, conservar captura y permitir corregir |
| Error de red o servidor | Informar si no se confirmó el guardado; reintentar de forma segura sin crear eventos duplicados |
| Acceso denegado | Bloquear la acción y mostrar una explicación; permisos definitivos en T12 |
| Registro clínico dado de baja | Aplicar política de baja lógica y conservación del historial, pendiente de detalle en T5/T12 |

No se establecen en esta tarea reglas de rangos fisiológicos, retención, fusión de duplicados, reasignación de propietarios ni autorizaciones de edición definitiva.

## Validación propuesta para la demostración

Los siguientes recorridos son guiones futuros, no pruebas ejecutadas. Se usarán datos ficticios.

| Guion | Recorrido | Qué permite comprobar | Escenarios existentes |
| --- | --- | --- | --- |
| GP-01 | Propietario y paciente nuevos; primera consulta; reapertura | Relación correcta, captura y recuperación | ES-01, ES-02, ES-03, ES-05 |
| GP-02 | Paciente recurrente; consulta de antecedentes; nueva atención | Historial cronológico sin alterar consultas anteriores | ES-03, ES-05 |
| GP-03 | Vacuna con próxima fecha y desparasitación sin próxima fecha | Opcionalidad y recordatorios controlados por veterinario | ES-04 |
| GP-04 | Guardar offline en Windows; reiniciar; reconectar | Persistencia, recuperación y envío posterior | ES-06, ES-07, ES-09, ES-14 |
| GP-05 | Editar el mismo registro desde dos dispositivos | Historial de conflicto y resultado verificable | ES-08 |
| GP-06 | Consultar y capturar desde celular | Legibilidad, acceso autorizado y comportamiento con conexión | ES-10, ES-11, ES-12, ES-15 |
| GP-07 | Registrar paciente, guardar consulta y consultar historial sin asistencia | Resultado de usabilidad por tarea y participante | ES-16 |

La aceptación exige evidencia de ejecución. La participación de personas de prueba se etiqueta como simulación escolar; no se atribuye a los médicos. No se presenta ningún porcentaje de éxito hasta medirlo.

## Pendientes para T5 y tareas posteriores

| Pendiente | Momento de resolución | Responsable de contraste |
| --- | --- | --- |
| Confirmar secuencia real de atención y momento de captura | T5, antes de fijar reglas de negocio | Usuario para demostración; CN para operación real |
| Significado de “Aplicación” y relación del seguimiento con consulta o episodio | T5/T9 | Usuario / CN; BG documenta |
| Campos mínimos, unidades y tratamiento de mediciones desconocidas | T5 | Usuario / CN; BG documenta |
| Edad estimada y nacimiento; fechas pasadas y próximas | T5/T9 | Usuario / CN |
| Permisos de corrección y autenticación offline | T12 | PC, con validación del usuario |
| Confirmación de personas y equipos de las pruebas | Antes de T43/T44 y compatibilidad | BG, coordinado con DA |

Las cuestiones pendientes no impiden documentar el flujo propuesto. No deben convertirse en reglas clínicas confirmadas por omisión de respuesta. T5 deberá presentar decisiones concretas para resolver las ambigüedades antes de implementar formularios.

## Criterios de cierre y siguiente tarea

- [x] Separar evidencia de formatos, acuerdos e inferencias del flujo.
- [x] Identificar actores, entradas y resultados de la atención.
- [x] Describir pacientes nuevos, recurrentes, carnet, seguimiento y correcciones.
- [x] Distinguir web conectada y escritorio offline con copia local.
- [x] Registrar excepciones, riesgos de pérdida y validaciones pendientes.
- [x] Preparar guiones de validación sin declarar pruebas realizadas.
- [x] Conservar responsable y fechas del cronograma.

Resultado: T4 preparada como análisis documental del proceso propuesto. Validación operativa clínica pendiente.

Siguiente tarea: T5 — Establecer las funciones y condiciones del sistema; responsable Brandon García Ordaz; ventana documental del 7 al 9 de septiembre de 2026.
