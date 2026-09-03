# T2 — Identificar a los participantes y sus necesidades

## Identificación

| Dato | Valor |
| --- | --- |
| Proyecto | VetCare System (VCS), Veterinaria La Vaquita Pinta |
| Fase | 2.0 — Planeación y requerimientos |
| Paquete de trabajo | 2.1 — Levantamiento de requisitos |
| Tarea | T2 — Identificar a los participantes y sus necesidades |
| Responsable documental | Brandon García Ordaz (BG) |
| Inicio previsto | 1 de septiembre de 2026 |
| Fin previsto | 3 de septiembre de 2026 |
| Preparación del registro | 18 de noviembre de 2026 |
| Estado | Identificación documental completada; validación clínica pendiente |

Las fechas previstas corresponden al cronograma. Este registro se prepara con los documentos y aclaraciones aportados; no acredita entrevistas ni reuniones realizadas en esas fechas.

## Objetivo y límite de la tarea

Identificar quién participa, quién utiliza o recibe beneficios del producto, qué necesita cada interesado y quién puede validar esas necesidades. El resultado alimenta la revisión de formatos T3, el análisis del proceso T4 y la definición de funciones T5. No sustituye la aprobación de requisitos de T7 ni define todavía la matriz detallada de permisos de T12.

T1 y T2 tienen ventanas superpuestas en el cronograma. El registro de acuerdos de T1 se utiliza aquí como insumo, sin modificar las fechas previstas.

## Fuentes y criterio de identificación

| Clave | Fuente | Aporte a T2 |
| --- | --- | --- |
| F01 | Charter_v3.pdf, secciones 1.1, 1.2, 1.5 y 1.6 | Cliente, sponsor, necesidad del negocio y beneficiarios |
| F02 | VCS-STK-001_Plan_Involucramiento_Interesados.pdf, secciones 2, 3 y 5 | Identificadores SH01–SH05, poder, interés, expectativas y canales |
| F03 | VCS-RES-001_Plan_Gestion_Recursos.pdf, secciones 2 y 3 | Integrantes, responsabilidades y autoridades |
| F04 | Declaracion_del_Alcance.pdf, secciones 1, 2 y 4 | Funcionalidades, aceptación y exclusiones |
| F05 | Plan_Gestion_Calidad.pdf, métricas y escenarios ES-01–ES-22 | Evidencia requerida y participación de los médicos |
| F06 | Fechas_cronograma.pdf, versión 2.0 | Fechas y responsable de T2 y tareas sucesoras |
| F07 | Fotografías de hoja clínica, carnet y material de identidad | Contexto de uso y datos visibles; análisis detallado reservado a T3 |
| F08 | Aclaraciones del usuario y registro de T1 | Roles, fecha de próxima aplicación opcional, dispositivos, nube, diseño y entregas |
| F09 | Documentos de riesgos R2, R7, R10, R11 y R12 | Adopción, disponibilidad, conectividad, permisos y participación en pruebas |

Se conservan los cinco códigos oficiales de interesados. Los integrantes se detallan dentro de SH05 para no crear códigos que contradigan el registro documental. Se distingue necesidad documentada, decisión del usuario y propuesta pendiente de validar.

## Registro de participantes e interesados

| ID | Participante | Relación con el proyecto | Poder / interés según F02 | Necesidad principal | Autoridad o participación |
| --- | --- | --- | --- | --- | --- |
| SH01 | Dr. Carlos E. Nieto Osorio (CN) | Representante del cliente y usuario clínico | Alto / alto | Historial clínico confiable, accesible y cercano al proceso de la clínica | Valida contenidos clínicos, autoriza desembolsos y acepta el producto |
| SH02 | Segundo médico de la clínica; identidad operativa por confirmar | Usuario clínico y validador en campo | Medio / alto | Registrar y consultar con facilidad desde escritorio y celular | Ejecuta flujos de uso y aporta observaciones; no se le atribuye autoridad presupuestaria |
| SH03 | Propietarios de animales | Beneficiarios indirectos | Bajo / medio | Continuidad del historial y seguimiento sanitario de sus animales | Sus necesidades se canalizan por la clínica; no acceden al sistema |
| SH04 | Efren Rolando Romero Leon (ER) | Sponsor académico | Alto en el ámbito académico / medio | Entregables, trazabilidad y evidencia de gestión y calidad | Valida entregables académicos según el marco documental |
| SH05 | Equipo técnico: DA, PC, OD y BG | Ejecución y seguimiento | Alto / alto | Alcance claro, tareas delimitadas y decisiones verificables | Cada integrante ejecuta las tareas de su área; DA coordina y BG gestiona requisitos y QA |

Los pacientes animales son las entidades clínicas atendidas y beneficiarios de la atención; no son cuentas de usuario ni se les asigna autoridad de aprobación. Vercel y alwaysdata son proveedores técnicos previstos, no usuarios clínicos ni aprobadores del alcance.

### Integrantes de SH05

| Clave | Integrante | Responsabilidad principal | Necesidad para ejecutar su trabajo |
| --- | --- | --- | --- |
| DA | Diego Alonso Coronel Vargas | Dirección, frontend, integración y manual | Conocer alcance, dependencias, fechas, bloqueos y decisiones de diseño |
| PC | Priscila Cortés Ramírez | Backend, API, permisos y sincronización | Datos y reglas consistentes; contratos de API y políticas de acceso, conflicto y recuperación |
| OD | Oscar Aarón Delgadillo Fernández | Arquitectura de datos, infraestructura, respaldos y despliegue | Entidades, condiciones de alojamiento y criterios verificables de integridad y restauración |
| BG | Brandon García Ordaz | Requisitos, Product Owner, QA y pruebas | Acceso a formatos, criterios de aceptación y evidencia; participantes y tareas identificados |

Se conservan las aclaraciones del usuario: T25 corresponde a PC y T43 a BG. La función de administrador del sistema no se asigna automáticamente al Project Manager ni al equipo técnico.

### Identidad del segundo médico

El material impreso menciona a Carlos Eduardo Nieto Osorio y Carlos Eduardo Nieto Sánchez. Los planes identifican a CN como representante y al otro usuario como “segundo médico”, sin asociar expresamente ese puesto a un nombre. Carlos Eduardo Nieto Sánchez queda como posible participante por confirmar, no como designación definitiva. No se transcriben teléfonos o correos de las fotografías al registro de interesados.

## Necesidades identificadas y trazabilidad inicial

Los identificadores NEC-T2 son referencias de este registro, no nuevos requisitos aprobados. Los códigos RE remiten a los requisitos existentes. La prioridad del backlog se definirá en T6.

| ID | Interesado | Necesidad | Origen / estado | Relación con requisitos existentes | Evidencia de satisfacción prevista |
| --- | --- | --- | --- | --- | --- |
| NEC-T2-01 | SH01, SH02; beneficio SH03 | Vincular propietarios con sus pacientes y mantener sus datos | F01, F04; documentada | RE01, RE02 | Registro, consulta y modificación con validaciones; ES-01 y ES-02 |
| NEC-T2-02 | SH01, SH02; beneficio SH03 | Registrar consultas, tratamientos y observaciones; consultar el historial completo | F01, F04, F07; documentada | RE03, RE05 | Consulta guardada y recuperada íntegramente; ES-03 y ES-05 |
| NEC-T2-03 | SH01, SH02 | Consultar y capturar sin internet desde Windows, sin perder cambios | F04 y F08; documentada y dispositivo confirmado por el usuario | RE06, RE09 | Reinicio y recuperación controlados, con persistencia; ES-06 y ES-09 |
| NEC-T2-04 | SH01, SH02 | Intercambiar cambios al recuperar conexión sin duplicar datos ni perder versiones clínicas | F04; documentada | RE07, RE08, RE14 | Pruebas de envío, reintentos y conflictos; ES-07, ES-08 y ES-14 |
| NEC-T2-05 | SH01, SH02; beneficio SH03 | Mantener vacunas y desparasitaciones con próxima fecha solo cuando el veterinario la indique | F04 y F08; decisión del usuario sobre el recordatorio opcional | RE04 | Guardado con y sin próxima fecha; recordatorio solo cuando exista fecha; ES-04 a detallar |
| NEC-T2-06 | SH01, SH02 | Acceder desde celular por navegador, sin instalar una aplicación móvil | F04 y F08; documentada; Chrome inicial confirmado | RE10, RE11, RE15 | Flujos responsivos y matriz de compatibilidad; ES-10, ES-11 y ES-15 |
| NEC-T2-07 | SH01, SH02 | Entender las pantallas, capturar con poca escritura y completar tareas sin ayuda | F02, F05, F07 y F08; documentada y preferencia de diseño confirmada | RE11, RE16 | Prototipos revisados y medición de tareas sin ayuda; ES-11 y ES-16 |
| NEC-T2-08 | SH01, SH02 | Restringir la información y las acciones a usuarios autorizados | F04 y F08; roles administrador y veterinario acordados; permisos pendientes | RE12 | Pruebas de acceso permitido y denegado; ES-12 |
| NEC-T2-09 | SH01, SH02 | Obtener un historial utilizable con tiempos de respuesta aceptables | F04 y F05; documentada | RE13 | Tres mediciones individuales menores a 30 s, caché fría y caliente por separado; ES-13 |
| NEC-T2-10 | SH04, SH05 | Demostrar requisitos, pruebas y resultados con trazabilidad y sin bloqueantes | F04 y F05; documentada; modalidad escolar confirmada por F08 | RE17, RE18, RE19 | Matriz requisito–caso–evidencia y registro de defectos; ES-17, ES-18 y ES-19 |
| NEC-T2-11 | SH01, SH04, SH05 | Entregar el sistema y un manual coherente con la versión final | F04, F05 y F06; documentada | RE20, RE22 | Instalación o despliegue verificado, manual y resultado de aceptación; ES-20 y ES-22 |
| NEC-T2-12 | SH04, SH05 | Mantener cambios controlados y trabajo separado por tarea, responsable y fechas | F01, F06 y F08; documentada y forma de entrega acordada | RE21, RE22 | Registro de decisiones y entregables relacionados con tareas; ES-21 y ES-22 |
| NEC-T2-13 | SH01, SH02, SH05 | Acceder a la web sin depender de una computadora local encendida, priorizando servicios gratuitos | F08; decisión del usuario; infraestructura pendiente de validación técnica | RE07, RE10, RE20; precisiones a incorporar en T5 | Prueba desde una red externa y con el equipo local apagado; no equivale a garantía de disponibilidad |

No se interpretan estas necesidades como autorización de inventario, cobros, agenda compleja, acceso de propietarios o módulos adicionales. Tampoco se deducen funciones de rayos X, ultrasonido o estética por aparecer en el material publicitario.

## Usuarios operativos y beneficiarios

| Perfil | Uso previsto | Límite pendiente o confirmado |
| --- | --- | --- |
| Administrador | Gestión de cuentas y configuración, como propuesta inicial para concretar en T12 | No se ha designado una persona para ese rol ni aprobado sus permisos detallados |
| Veterinario | Uso clínico: pacientes, consultas, historial y carnet | Permisos precisos y autenticación offline se especificarán en T12 |
| Propietario de animal | Beneficiario del seguimiento | Sin cuenta y sin acceso directo, conforme al alcance |
| Evaluador académico | Revisión de demostración y documentación | No requiere un rol permanente en la aplicación por defecto |

Ambos médicos son usuarios clínicos previstos. La distribución final de cuentas y roles no puede deducirse solo de sus cargos o nombres.

## Participación, validación y canales previstos

Estas interacciones provienen del plan de interesados. Su registro no acredita que se hayan celebrado ni implica envío de comunicaciones.

| Participante | Qué se debe contrastar o entregar | Canal previsto | Coordinación |
| --- | --- | --- | --- |
| SH01 | Campos clínicos, prototipos, decisiones de alcance y resultados de aceptación | Revisión con la clínica, demostración y actas; reunión o correo según F02 | DA coordina; BG consolida requisitos y hallazgos |
| SH02 | Flujo de captura, facilidad de uso y acceso móvil | Observación y pruebas de tareas; sesiones previstas del 10–13 y 16–20 de noviembre | BG, con coordinación de DA |
| SH03 | Necesidades detectadas durante la atención | Canal indirecto mediante la clínica | CN canaliza; BG registra |
| SH04 | Avance, entregables, evidencia y riesgos académicos | Informe documental por hito y seguimiento previsto | DA |
| SH05 | Dependencias, bloqueos, decisiones y entregas | Repositorio y seguimiento de tareas; Microsoft Project como referencia documental | DA coordina; cada responsable aporta su trabajo |

Para la demostración escolar pueden prepararse guiones y cuentas ficticias. Una simulación no acredita participación real de CN o del segundo médico, ni reemplaza sus firmas si después se realiza una aceptación clínica.

## Preguntas pendientes y momento de resolución

| ID | Pregunta | Quién puede resolverla | Momento | Tratamiento mientras se confirma |
| --- | --- | --- | --- | --- |
| P-T2-01 | ¿Carlos Eduardo Nieto Sánchez será el segundo usuario clínico y participante en pruebas? | Usuario o representante de la clínica | Antes de pruebas con participantes nominales | Conservar SH02 como “segundo médico”; usar cuentas ficticias en demostración |
| P-T2-02 | ¿Quién asumirá la administración de usuarios en una eventual instalación real? | Usuario o CN | T12, antes de crear cuentas operativas | Definir el rol sin asignarlo a una persona ni publicar credenciales |
| P-T2-03 | ¿Qué campos son obligatorios y cómo transcurre la atención real, incluidas correcciones y seguimiento? | CN y segundo médico; usuario para la demostración | T3, T4 y T5 | Usar los formatos como evidencia documental y distinguir propuestas de reglas confirmadas |
| P-T2-04 | ¿Qué equipos y versiones concretas se usarán para verificar compatibilidad? | Usuario o clínica | Antes de pruebas de compatibilidad | Windows y Chrome iniciales; Android e iOS como objetivos sujetos a comprobación |
| P-T2-05 | ¿Habrá validación real con médicos o solo demostración con participantes de prueba? | Usuario | Antes de T43/T44 | Modalidad escolar por defecto; no atribuir resultados a médicos sin participación |

No se requiere resolver estas preguntas para completar la identificación documental T2. Sí deben resolverse antes de las actividades que dependan de ellas. La falta de entrevistas se registra como límite de la evidencia, sin inventar respuestas.

## Riesgos relacionados

| Riesgo existente | Relación con T2 | Acción que alimenta |
| --- | --- | --- |
| R2 — Adopción clínica | Los médicos necesitan un flujo claro y cercano al papel | Revisión de prototipos y tareas de usabilidad observables |
| R7 — Disponibilidad del equipo | Las decisiones dependen de responsables identificados | Registrar responsable de cada pendiente y escalar bloqueos |
| R10 — Conectividad | Los contextos escritorio offline y web online tienen necesidades distintas | Separar sus expectativas y pruebas |
| R11 — Acceso no autorizado | Los beneficiarios indirectos no son usuarios con acceso | Definir roles y validar permisos antes de operar con datos reales |
| R12 — Sesión incompleta | Debe conocerse quién participará realmente | Confirmar identidad y agenda antes de sesiones nominales |

## Criterios de cierre y siguiente tarea

- [x] Conservar los cinco identificadores de interesados de F02.
- [x] Distinguir usuarios clínicos, equipo, sponsor y beneficiarios indirectos.
- [x] Identificar necesidades y relacionarlas con requisitos existentes.
- [x] Identificar responsables de validación y canales previstos.
- [x] Registrar decisiones del usuario y cuestiones pendientes sin inventar entrevistas.
- [x] Mantener fechas y responsable de T2.

Resultado: entregable documental T2 preparado. La aprobación formal de requisitos sigue correspondiendo a T7.

Siguiente tarea: T3 — Revisar los formatos médicos utilizados en la clínica; responsable Brandon García Ordaz; ventana documental del 2 al 4 de septiembre de 2026. Se analizarán los campos, el orden, las relaciones y las diferencias entre los formatos físicos y el alcance acordado.
