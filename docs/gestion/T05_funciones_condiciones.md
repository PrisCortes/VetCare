# T5 — Establecer las funciones y condiciones del sistema

## Identificación

| Dato | Valor |
| --- | --- |
| Proyecto | VetCare System, Veterinaria La Vaquita Pinta |
| Fase / paquete | 2.0 — Planeación y requerimientos / 2.1 — Levantamiento |
| Responsable documental | Brandon García Ordaz (BG) |
| Inicio previsto | 7 de septiembre de 2026 |
| Fin previsto | 9 de septiembre de 2026 |
| Preparación del registro | 18 de noviembre de 2026 |
| Estado | Especificación candidata preparada; decisiones de captura pendientes y aprobación formal en T7 |

Las fechas previstas corresponden al cronograma; no certifican ejecución histórica. Los criterios siguientes describen comportamiento esperado, no pruebas ejecutadas.

## Objetivo y autoridad de las fuentes

Consolidar RE01–RE22 en funciones, condiciones y criterios comprobables. Fuentes: Charter_v3.pdf, Declaracion_del_Alcance.pdf, Diccionario_EDT.pdf, VCS-PMP-001 v2.1, Plan_Gestion_Calidad.pdf, Fechas_cronograma.pdf y decisiones del usuario. Se utilizan los análisis [T1](T01_revision_documental.md), [T2](T02_participantes_necesidades.md), [T3](T03_revision_formatos_medicos.md) y [T4](T04_proceso_atencion.md).

Se conservan los identificadores existentes: las precisiones de esta tarea no crean requisitos nuevos automáticamente. “Documentado” significa presente en las fuentes; “acordado” identifica una decisión expresa del usuario; “propuesto” requiere revisión antes de convertirse en regla definitiva. T7 concentra la aprobación de requisitos y no se considera realizada por preparar este archivo.

## Funciones del producto: RE01–RE12

| ID | Función | Criterio de aceptación verificable | Referencia de prueba |
| --- | --- | --- | --- |
| RE01 | Gestionar propietarios | Crear, consultar, actualizar y dar de baja lógicamente un propietario, conservar vínculos e historial y rechazar los campos obligatorios que se acuerden en esta especificación | ES-01 |
| RE02 | Gestionar pacientes multiespecie | Registrar y consultar pacientes vinculados con propietario; cubrir perros, gatos, caballos, vacas y borregos, con opción otras; validar los datos mínimos acordados sin usar el nombre como clave única | ES-02 |
| RE03 | Gestionar expediente clínico | Crear, consultar y modificar consultas con fecha, peso, temperatura, FC, FR, diagnóstico, tratamiento y observaciones; recuperar lo guardado y omitir presión arterial | ES-03 |
| RE04 | Gestionar carnet sanitario | Registrar vacunación y desparasitación; admitir próxima fecha vacía o indicada por veterinario; mostrar recordatorios únicamente cuando exista fecha, sin calcular pautas clínicas automáticamente | ES-04 |
| RE05 | Consultar historial completo | Mostrar consultas y carnet del paciente correcto en escritorio y web; conservar fechas clínicas y ordenar cronológicamente sin mezclar pacientes | ES-05 |
| RE06 | Capturar y consultar offline en Windows | Con sesión offline autorizada según T12, guardar y recuperar datos locales tras reiniciar sin red; conservar cambios pendientes y señalar que el historial local puede estar desactualizado | ES-06 |
| RE07 | Sincronizar automáticamente | Intentar intercambio al abrir, cerrar normalmente y recuperar conexión; reintentar con identificadores estables; verificar en servidor los cambios y conservar pendientes ante errores | ES-07 |
| RE08 | Resolver conflictos conservando versiones | Aplicar LWW con historial de versiones desplazadas y desempate determinista; conservar evidencia de ambas versiones; solicitar revisión cuando no se resuelva de forma segura | ES-08 |
| RE09 | Crear snapshots y restaurar | Generar snapshot local por guardado de consulta y restaurar en entorno aislado; advertir antes de sobrescribir cambios más recientes; verificar recuperación íntegra de escenarios críticos | ES-09 |
| RE10 | Permitir acceso web responsivo | Consultar expediente desde navegador móvil por enlace HTTPS y con autenticación, sin instalar app; utilizar servidor en la nube independiente de la computadora del usuario | ES-10 |
| RE11 | Simplificar captura móvil | Registrar una consulta desde celular con campos agrupados, controles legibles y poca escritura repetitiva; conservar el orden general del formato y señalar errores sin perder texto | ES-11 |
| RE12 | Autenticar y controlar permisos | Permitir acciones únicamente a cuentas y roles autorizados, verificar permisos en servidor y bloquear acceso indebido; roles administrador y veterinario, con matriz precisa en T12 | ES-12 |

Condiciones comunes: navegador y Electron se comunican con la API, no directamente con MariaDB. Las operaciones de la web requieren conexión; la promesa offline corresponde al escritorio. La integridad de bajas, ediciones y conflictos exige conservación del historial, no borrado clínico irreversible.

## Condiciones no funcionales: RE13–RE15

| ID | Condición | Criterio de aceptación |
| --- | --- | --- |
| RE13 | Rendimiento de consulta | Cada una de tres mediciones desde solicitud hasta historial utilizable es menor a 30 segundos; caché fría y caliente en series separadas; reportar máximo y no solo promedio. Dispositivo, red y datos de prueba deben quedar registrados (ES-13, M08) |
| RE14 | Integridad del intercambio | Cero pérdidas o duplicaciones irreversibles en los casos definidos; comprobar resultados antes y después, incluidos reintentos, interrupciones y conflictos (ES-14, M05b) |
| RE15 | Compatibilidad | Todos los flujos críticos funcionan sin controles inaccesibles en la matriz de equipos y navegadores acordada. Windows y Chrome iniciales; Android e iOS/Safari como objetivos a comprobar, sin declarar compatibilidad universal (ES-15, M12) |

El despliegue propuesto conserva PHP, MariaDB, SQLite y Electron. PHP en Vercel mediante runtime comunitario y la conexión cifrada externa a MariaDB requieren prueba técnica antes de desarrollar sobre una suposición de compatibilidad. No se guardan datos centrales persistentes en el disco temporal de una función.

## Calidad y validación: RE16–RE19

| ID | Condición | Criterio de aceptación |
| --- | --- | --- |
| RE16 | Usabilidad sin ayuda | Al menos 90 % de tareas críticas completadas sin asistencia en las dos sesiones previstas; registrar participante, tarea, resultado y asistencia. Las tareas son registrar paciente, guardar consulta y consultar historial (ES-16, M15) |
| RE17 | Calidad funcional del núcleo | Aprobar el 100 % de los casos obligatorios del núcleo antes de H5, el 9 de noviembre; mantener trazabilidad requisito–caso–evidencia. El umbral de 90 % para casos críticos no reduce el de casos obligatorios (ES-17, M04) |
| RE18 | Cero bloqueantes al cierre | Cero defectos bloqueantes abiertos al 23 de noviembre de 2026; incluye pérdida/corrupción de datos, flujo esencial bloqueado o caída sin recuperación (ES-18, M09) |
| RE19 | Validación en dos sesiones | Documentar participantes, casos, hallazgos y regresión de las ventanas del 10–13 y 16–20 de noviembre. Identificar expresamente las simulaciones escolares; no atribuir actas o resultados a médicos que no participaron (ES-19) |

La modalidad inicial acordada es demostración escolar. El criterio clínico documental se conserva como tal; la simulación entrega evidencia de demostración y no se presenta como aceptación clínica real.

## Entrega y gestión: RE20–RE22

| ID | Condición | Criterio de aceptación |
| --- | --- | --- |
| RE20 | Manual y despliegue | Entregar manual consistente con la versión liberada, web/API/base central operativas y distribución de Electron para Windows; verificar instalación y acceso. La aceptación clínica M10 solo se registra si efectivamente existe (ES-20) |
| RE21 | Cambios controlados | Relacionar cada cambio con decisión, impacto y entregable; mantener registro de las aclaraciones del usuario y no alterar silenciosamente líneas base (ES-21, M01) |
| RE22 | Plazo y presupuesto | Conservar H7 al 27 de noviembre de 2026 y el presupuesto documental de $1,980 MXN como referencia; diferenciar presupuesto, costo previsto y desembolso real. Priorizar costo cero según instrucción del usuario (ES-22) |

Las horas se conservan como referencia documental secundaria. Los entregables se organizan por fechas, responsable y dependencias. No se declaran consumos, firmas ni resultados no medidos. Los servicios gratuitos no permiten prometer disponibilidad garantizada; sí se exige que la aplicación alojada no dependa de una computadora local encendida. El mantenimiento posterior a H7 no se incorpora al alcance.

## Decisiones ya acordadas

| ID local | Decisión | Efecto |
| --- | --- | --- |
| AC-01 | Administrador y veterinario; propietarios sin acceso | Dos roles a detallar en T12, sin portal de propietarios |
| AC-02 | Próxima fecha opcional indicada por veterinario | No se inventan intervalos sanitarios; ausencia se muestra como “Sin fecha programada” |
| AC-03 | Windows para Electron; web móvil inicialmente en Chrome | Matriz de compatibilidad posterior, incluyendo comprobación de iOS |
| AC-04 | Vercel elegido por el usuario; MariaDB en alwaysdata propuesta para demostración | Cuentas y prueba de conectividad pendientes; sin administrar máquinas virtuales |
| AC-05 | T25 de PC y T43 de BG | Mantener las fechas del cronograma y las demás asignaciones |
| AC-06 | Persistencia offline en H3; snapshots completos después de T36, antes de H5 | No declarar snapshots terminados en H3 |
| AC-07 | Diseño simple, intuitivo, minimalista y profesional con identidad aportada | Referencia de paleta de T1; prototipos T10/T11 |
| AC-08 | Una tarea por vez cuando las dependencias lo permitan | El usuario realiza los commits; no crearlos automáticamente |

## Propuesta concreta de campos y obligatoriedad

Esta sección resuelve el trabajo de especificación mediante una propuesta revisable; no atribuye aprobación a la clínica. Se propone persistir únicamente eventos completos según sus mínimos, sin introducir todavía un módulo de borradores. Los campos opcionales vacíos se guardan como ausencia y no como cero ni texto ficticio.

| Registro | Mínimos propuestos para guardar | Opcionales propuestos | Reglas |
| --- | --- | --- | --- |
| Propietario | Nombre | Teléfono, domicilio, localidad | Identificador técnico propio; los contactos vacíos no bloquean la atención |
| Paciente | Nombre o identificación, especie y propietario existente | Raza, nacimiento conocido o edad estimada | Otras especies admitidas; no imponer nombre único |
| Consulta | Paciente, fecha y diagnóstico/motivo registrado | Peso, temperatura, FC, FR, tratamiento y observaciones | Propuesta: diagnóstico/motivo admite texto “en valoración” si lo escribe el veterinario; nunca rellenarlo automáticamente |
| Seguimiento | Consulta relacionada, fecha y descripción de aplicación/intervención | Observaciones | Propuesta: relacionarlo con una consulta, sin crear una entidad “episodio” adicional |
| Vacunación | Paciente, vacuna y fecha del evento | Aplicación como texto libre y próxima fecha | No exigir consulta completa; preservar el término de la hoja sin inferir dosis, vía o firma |
| Desparasitación | Paciente, producto y fecha del evento | Peso y próxima fecha | Etiqueta digital propuesta “Desparasitante”; sin cálculo de dosis |

Los mínimos anteriores no están deducidos de asteriscos del papel: no hay marcas visibles que los indiquen. La terminología “diagnóstico/motivo” es una precisión propuesta para evitar exigir un diagnóstico cerrado y debe confirmarse antes de diseñar el formulario definitivo. Un registro clínico sigue asociado al usuario que lo crea, mediante metadatos técnicos que se especifican en T9/T12.

### Unidades y fechas propuestas

- Peso: kilogramos, con decimales; temperatura: grados Celsius; FC: latidos por minuto; FR: respiraciones por minuto. Son convenciones de captura propuestas, no rangos clínicos.
- Datos numéricos presentes deben ser números finitos; peso y frecuencias mayores que cero. No se aplican límites fisiológicos por especie sin validación. Límites técnicos y longitud de texto se definirán y documentarán con el esquema y la API.
- Fecha clínica separada de creación, modificación y sincronización. Se permite captura pasada a demanda, con trazabilidad.
- Propuesta: fecha de evento no posterior al día actual en la zona de la clínica; próxima fecha, cuando exista, no anterior a la fecha del evento. Un recordatorio pasado respecto de hoy puede aparecer vencido y no debe eliminarse por ello.
- Propuesta: nacimiento conocido no posterior a la atención; edad calculada respecto de la fecha de cada evento. Si se conoce solo edad aproximada, conservar valor, unidad y fecha de referencia, sin convertirla en nacimiento exacto.
- Propuesta: utilizar días/meses/años para edad estimada y mostrar explícitamente que se trata de una estimación. El comportamiento de cambio entre nacimiento conocido y estimación se detalla en T9.

## Reglas de negocio y conservación

| ID local | Regla | Estado |
| --- | --- | --- |
| RN-01 | Un propietario puede tener varios pacientes; cada paciente tiene una referencia de propietario | Documentado; cambios de titularidad por precisar si se solicitan |
| RN-02 | Cada visita genera una consulta distinta; una corrección no crea una visita ficticia | Propuesto a partir de T4 |
| RN-03 | Vacunas y desparasitaciones pueden registrarse sin consulta completa; siempre pertenecen a un paciente | Propuesto |
| RN-04 | Una próxima fecha vacía no genera recordatorio ni se sustituye por una fecha predeterminada | Acordado |
| RN-05 | LWW conserva versiones desplazadas; ningún conflicto autoriza borrado irreversible | Documentado |
| RN-06 | Dar de baja propietario/paciente conserva historial; propuesta: no crear nuevas atenciones de un paciente inactivo hasta reactivarlo | Conservación documentada; bloqueo/reactivación propuestos para T12 |
| RN-07 | Corregir o restaurar no debe sobrescribir silenciosamente cambios posteriores | Documentado |
| RN-08 | La edad y el peso históricos se muestran en el contexto de su evento; no se reemplazan por datos actuales | Propuesto para preservar interpretación histórica |
| RN-09 | La captura web depende del servidor; la captura offline autorizada persiste en SQLite y conserva cola | Documentado; autorización offline por diseñar en T12 |
| RN-10 | No se incluyen PA, inventario, farmacia, facturación, caja, agenda compleja, apps móviles nativas ni acceso de propietarios | Documentado |

## Condiciones de seguridad e interacción

- Autenticar y autorizar cada operación en servidor; ocultar un botón no sustituye una comprobación de permisos.
- Excluir credenciales de Git, del navegador y del instalador. Gestionar secretos del backend fuera del código versionado.
- Utilizar consultas parametrizadas y validar datos en servidor y escritorio de manera coherente. Detalles de sesión, protección de solicitudes y transporte se diseñan en T12/T18/T19.
- Utilizar datos ficticios para desarrollo y demostración; no subir bases, snapshots o datos clínicos reales al repositorio.
- No confirmar guardado antes de persistir; distinguir “guardado local”, “pendiente de sincronización”, “sincronizado” y “error”. Los estados definitivos y sus transiciones se definen en T8/T32.
- Mantener texto del formulario al mostrar errores. En web sin conexión, informar que no hay guardado confirmado; no prometer almacenamiento offline del navegador.
- Señalar el contexto del paciente en pantallas clínicas. En errores de selección, no reasignar automáticamente eventos a otro animal.
- No agregar cuentas públicas, notificaciones por correo/SMS, carga de imágenes, impresión PDF ni módulos derivados de la publicidad sin decisión de alcance.

## Verificación prevista y dependencias

| Momento | Qué se define o comprueba | Responsable documental o técnico |
| --- | --- | --- |
| T6 | Prioridad y dependencia de actividades a partir de esta especificación candidata | BG |
| T7 | Revisión y aprobación de requisitos; registrar las decisiones pendientes | BG; validadores según documentos y modalidad escolar |
| T8/T9 | Arquitectura, modelo, entidades, identificadores y versiones | OD |
| T10/T11 | Prototipos y comportamiento de campos/errores en escritorio y móvil | DA |
| T12/T13 | Permisos, autenticación offline, guardado y recuperación | PC |
| T15/T18 | Prueba de PHP en Vercel y conexión segura con MariaDB | OD / PC según cada tarea |
| T20–T29 | Implementación de módulos y formularios según asignaciones originales | Responsable de cada tarea |
| T26 y tareas de pruebas | Ejecutar ES-01–ES-22 por alcance, registrar resultados y evidencia | BG y apoyos definidos en el plan de calidad |

No se declara terminado un escenario por tenerlo descrito. Las pruebas iniciales pueden utilizar simulaciones; la integración y la persistencia requieren pruebas sobre servicios reales antes de dar por validado el despliegue.

## Decisiones pendientes para cerrar la versión candidata

| ID | Decisión propuesta | Quién la confirma | Efecto si cambia |
| --- | --- | --- | --- |
| D-T5-01 | “Aplicación” se captura como texto libre; el seguimiento pertenece a una consulta y los eventos sanitarios pueden ser independientes | Usuario para demo; CN antes de uso clínico | Modifica relación de seguimiento y campos del carnet |
| D-T5-02 | Aceptar los mínimos y opcionales de la tabla, incluido diagnóstico/motivo y mediciones opcionales | Usuario para demo; CN antes de uso clínico | Modifica validaciones de captura y pruebas de campos obligatorios |
| D-T5-03 | Usar kg, °C, latidos/min y respiraciones/min; edad estimada sin nacimiento ficticio; fechas según reglas propuestas | Usuario para demo; CN para criterios clínicos | Modifica validaciones y representación del historial |

Estas propuestas permiten una revisión concreta sin detener las tareas independientes de priorización. No se consideran aprobadas por silencio. No es necesario decidir todavía la identidad del administrador, la política detallada de sesión offline o los valores clínicos por especie; pertenecen a tareas posteriores.

## Criterios de cierre y siguiente tarea

- [x] Consolidar RE01–RE22 conservando sus identificadores.
- [x] Expresar criterios comprobables y relacionarlos con ES-01–ES-22.
- [x] Incorporar decisiones del usuario y límites de la demostración escolar.
- [x] Proponer campos mínimos, unidades, fechas y relaciones para resolver dudas de T3/T4.
- [x] Separar requisitos documentados de decisiones propuestas.
- [x] Conservar fechas, responsables y dependencias sin implementar todavía funcionalidades.
- [ ] Confirmar D-T5-01, D-T5-02 y D-T5-03 antes de cerrar la versión candidata para T7.

Resultado: entregable T5 preparado para revisión; no equivale a aprobación formal de requisitos.

Siguiente tarea: T6 — Organizar y priorizar las actividades del proyecto; responsable Brandon García Ordaz; ventana documental del 9 al 11 de septiembre de 2026.
