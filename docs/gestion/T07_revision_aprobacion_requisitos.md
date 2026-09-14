# T7 — Revisión y aprobación de los requisitos (H1)

## Identificación y resultado actual

| Dato | Valor |
| --- | --- |
| Fase / paquete | 2.0 — Planeación y requerimientos / 2.2 — Aprobación de requisitos |
| Responsable documental | Brandon García Ordaz (BG) |
| Inicio previsto | 11 de septiembre de 2026 |
| Fin previsto / hito | 14 de septiembre de 2026 / H1 |
| Preparación del paquete | 18 de noviembre de 2026 |
| Versión de revisión | Candidata 0.1 |
| Estado | Paquete preparado; decisión de aprobación pendiente |

Se conservan las fechas del cronograma. La preparación actual no acredita aprobación el 14 de septiembre ni una firma de la clínica o del sponsor académico. Esta tarea reúne un resultado concreto para revisión; H1 no se declara cumplido mientras no exista la decisión correspondiente.

## Paquete sometido a revisión

| Documento | Contenido que se revisa |
| --- | --- |
| [T1 — Revisión documental](T01_revision_documental.md) | Fuentes, alcance, exclusiones, fechas y acuerdos |
| [T2 — Participantes y necesidades](T02_participantes_necesidades.md) | Interesados, usuarios, beneficiarios y necesidades |
| [T3 — Formatos médicos](T03_revision_formatos_medicos.md) | Campos visibles, diferencias y propuestas de captura |
| [T4 — Proceso de atención](T04_proceso_atencion.md) | Flujo propuesto, variantes, errores y límites de evidencia |
| [T5 — Funciones y condiciones](T05_funciones_condiciones.md) | RE01–RE22, criterios, mínimos propuestos y reglas |
| [T6 — Organización y prioridades](T06_organizacion_prioridades.md) | 52 tareas, fechas, responsables y dependencias propuestas |

T5 es la especificación candidata que se somete a decisión; T1–T4 y T6 aportan contexto y trazabilidad. Las fuentes PDF siguen siendo los documentos de origen y no se sustituyen ni se modifican. Este archivo registra la revisión sin reproducir otra especificación que pudiera divergir de T5.

## Alcance consolidado para decisión

El producto incluye propietarios, pacientes multiespecie, consultas e historial, vacunas y desparasitación, usuarios con roles administrador/veterinario, web responsiva conectada y escritorio Windows con SQLite offline. La sincronización se realiza mediante API con idempotencia, LWW, conservación de versiones y revisión de conflictos; los snapshots locales se verifican antes de H5 según el ajuste documentado.

Se excluyen PA, inventario, farmacia, ventas, facturación, agenda compleja, apps móviles nativas, migración masiva de papel y acceso de propietarios al sistema. La publicidad de la clínica no amplía el producto. No se incluyen pautas sanitarias o dosis automáticas; próxima fecha solo cuando la indica el veterinario.

Vercel es la plataforma elegida por el usuario. MariaDB en alwaysdata es la propuesta para la base central académica. Las pruebas de PHP y conexión cifrada siguen pendientes y no se consideran resueltas por aprobar requisitos. El acceso web no dependerá de una computadora local encendida; un plan gratuito no equivale a disponibilidad garantizada.

## Registro de revisión de requisitos

“Revisado documentalmente” significa que la especificación candidata contiene función o condición, criterio verificable y referencia de prueba. No significa implementado, probado o aprobado por CN/ER. Todos los requisitos esperan la decisión del paquete; la columna de detalle señala precisiones pendientes, no requisitos opcionales.

| ID | Objeto de revisión | Estado documental | Precisión o dependencia |
| --- | --- | --- | --- |
| RE01 | Propietarios | Revisado documentalmente | Mínimos de captura: D-T5-02 |
| RE02 | Pacientes multiespecie | Revisado documentalmente | Mínimos y edad: D-T5-02/03 |
| RE03 | Expediente clínico | Revisado documentalmente | Aplicación/seguimiento, campos y unidades: D-T5-01/02/03 |
| RE04 | Carnet sanitario | Revisado documentalmente | Aplicación, unidades y fechas: D-T5-01/03; próxima fecha opcional ya acordada |
| RE05 | Historial completo | Revisado documentalmente | Conservación de valores históricos y relaciones según decisiones pendientes |
| RE06 | Escritorio offline | Revisado documentalmente | Política de autenticación offline en T12 |
| RE07 | Sincronización automática | Revisado documentalmente | Contratos y cola en diseño e implementación |
| RE08 | Conflictos y versiones | Revisado documentalmente | Desempate y relojes desalineados en diseño técnico |
| RE09 | Snapshots y restauración | Revisado documentalmente | Evidencia completa posterior a T36 y anterior a H5 |
| RE10 | Acceso web responsivo | Revisado documentalmente | Despliegue y conectividad externa por verificar |
| RE11 | Captura móvil simple | Revisado documentalmente | Prototipos basados en campos acordados |
| RE12 | Acceso y permisos | Revisado documentalmente | Matriz de roles y sesiones en T12 |
| RE13 | Rendimiento | Revisado documentalmente | Cada medición menor a 30 s; dispositivo y datos por definir |
| RE14 | Integridad de sincronización | Revisado documentalmente | Evidencia de casos con reintentos y conflictos |
| RE15 | Compatibilidad | Revisado documentalmente | Matriz concreta de equipos y navegadores pendiente |
| RE16 | Usabilidad sin ayuda | Revisado documentalmente | Participantes reales o simulados identificados |
| RE17 | Calidad del núcleo | Revisado documentalmente | 100 % de casos obligatorios antes de H5 |
| RE18 | Cero bloqueantes | Revisado documentalmente | Cierre con evidencia, previsto al 23 de noviembre |
| RE19 | Dos sesiones de validación | Revisado documentalmente | Modalidad escolar no acredita sesiones clínicas reales |
| RE20 | Manual y despliegue | Revisado documentalmente | Instalación/distribución Windows y nube por ejecutar |
| RE21 | Control de cambios | Revisado documentalmente | Registrar decisiones y cambios sin alterar silenciosamente las fuentes |
| RE22 | Plazo y presupuesto | Revisado documentalmente | H7 27 de noviembre; costo cero prioritario y desembolsos reales diferenciados |

## Decisiones concretas pendientes del usuario

Las tres decisiones siguientes proceden de T5. Pueden aceptarse en conjunto para la demostración escolar o corregirse por identificador. Su aceptación no equivale a validar criterios clínicos para una instalación real.

### D-T5-01 — Aplicación y relaciones

- Capturar “Aplicación” como texto libre, sin asumir que significa dosis, firma o vía.
- Vincular cada seguimiento con una consulta, conservando fecha, descripción y observaciones.
- Permitir registrar vacunas y desparasitaciones directamente para un paciente sin exigir una consulta completa.

### D-T5-02 — Mínimos de captura

| Registro | Obligatorios propuestos |
| --- | --- |
| Propietario | Nombre |
| Paciente | Nombre o identificación, especie y propietario existente |
| Consulta | Paciente, fecha y diagnóstico/motivo escrito por el veterinario |
| Seguimiento | Consulta relacionada, fecha y descripción |
| Vacunación | Paciente, vacuna y fecha |
| Desparasitación | Paciente, producto y fecha |

Teléfono, domicilio, localidad, raza, nacimiento/edad, mediciones clínicas, tratamiento, notas y próxima fecha permanecen opcionales según su registro. No se insertan ceros ni diagnósticos predeterminados para completar faltantes. La obligatoriedad anterior es una propuesta de la demostración, no una inferencia de los formatos.

### D-T5-03 — Unidades, edad y fechas

- Peso en kg, temperatura en °C, FC en latidos/min y FR en respiraciones/min; sin rangos fisiológicos inventados.
- Edad calculada cuando se conozca nacimiento o estimada con valor, unidad y fecha de referencia; no generar una fecha de nacimiento ficticia.
- Admitir eventos pasados a demanda; proponer que la fecha del evento no sea futura y que próxima fecha, si existe, sea igual o posterior a la fecha del evento.
- Conservar por separado fecha clínica y marcas técnicas; una próxima fecha anterior al día actual puede mostrarse vencida sin eliminarse.

La instrucción de continuar permitió preparar este paquete. No se registra como aceptación implícita de estas propuestas.

## Resultado de las comprobaciones documentales

| Comprobación | Resultado |
| --- | --- |
| Identificadores de requisitos | T5 contiene RE01–RE22 sin crear códigos sustitutos |
| Criterios y escenarios | T5 relaciona cada requisito con sus criterios y ES-01–ES-22; no hay ejecuciones acreditadas |
| Actividades | T6 contiene las 52 tareas, fechas y responsables, con aclaraciones T25 PC y T43 BG |
| Exclusiones | PA y módulos comerciales permanecen excluidos |
| Diferencias del cronograma | Se usa 27 de noviembre como final vigente y se preserva la distinción H3/snapshots |
| Decisiones abiertas | D-T5-01/02/03 identificadas y presentadas de forma revisable |
| Evidencia operativa | No existe todavía código, despliegue o prueba clínica ejecutada |

No se presenta M11 como 100 %: falta la decisión de requisitos y no se han recibido aprobaciones de CN ni ER. Tampoco se presenta la trazabilidad documental como cumplimiento de las métricas de pruebas M04/M14.

## Registro de decisiones y autoridad

| Revisor o autoridad | Ámbito | Decisión recibida para este paquete | Fecha de decisión |
| --- | --- | --- | --- |
| Usuario solicitante | Aceptación del alcance y convenciones para demostración escolar | Pendiente | Sin registro |
| Brandon García Ordaz | Responsable documental de T7 | No se acredita revisión personal por haber preparado este archivo | Sin registro |
| Dr. Carlos E. Nieto Osorio | Validación clínica y aceptación según documentos | Pendiente; no se ha solicitado ni simulado firma | Sin registro |
| Efren Rolando Romero Leon | Aprobación académica según documentos | Pendiente; no se ha solicitado ni simulado firma | Sin registro |

La aceptación del usuario se registrará como decisión del solicitante para la demostración, sin atribuirle la identidad o autoridad de CN, BG o ER. La decisión debe vincularse con la versión candidata y con los identificadores aceptados o corregidos. Las fechas reales de decisión no se sustituyen por las fechas previstas del hito.

Resultados posibles: aprobado para demostración, aprobado con observaciones identificadas, requiere correcciones o pendiente. “Aprobado para demostración” no acredita aprobación clínica/académica formal de H1. Los cambios aceptados se reflejarán en T5 y se referenciarán aquí, manteniendo la historia de lo decidido.

## Condiciones para avanzar al diseño

T8 puede preparar límites entre web, API, almacenamiento central y escritorio usando los acuerdos ya recibidos. T9 y los formularios deben conservar las decisiones de campos y relaciones como candidatas hasta confirmarlas. No es necesario resolver ahora detalles de implementación que tienen tarea propia, como tiempos de sesión offline, desempates de conflictos, identidad del administrador o versiones concretas de los dispositivos.

No se adelantará una declaración de H1 cumplido para justificar el solapamiento de T8/T9 con T7. Se registrará el diseño provisional sobre una versión candidata cuando corresponda, conforme a T6.

## Criterios de cierre

- [x] Reunir las fuentes y entregables T1–T6 en un paquete revisable.
- [x] Verificar cobertura documental de RE01–RE22.
- [x] Presentar decisiones de captura concretas y su efecto.
- [x] Distinguir revisión documental, aceptación escolar y aprobación formal.
- [x] Conservar responsable, ventana del cronograma y H1.
- [ ] Recibir y registrar decisión del usuario sobre la especificación y D-T5-01/02/03.
- [ ] Actualizar T5 si hay correcciones y registrar la versión resultante.
- [ ] Obtener aprobaciones clínicas/académicas si se requiere declarar H1 formalmente cumplido.

Resultado: paquete de T7 preparado; aprobación pendiente. Siguiente actividad de diseño: T8 — Definir cómo funcionarán las partes del sistema; responsable Oscar Aarón Delgadillo Fernández; ventana documental del 10 al 14 de septiembre de 2026.
