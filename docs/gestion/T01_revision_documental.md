# T1 — Revisar los documentos y acuerdos del proyecto

## Identificación

| Dato | Valor |
| --- | --- |
| Proyecto | VetCare System (VCS), Veterinaria La Vaquita Pinta |
| Fase | 1.0 — Gestión del proyecto |
| Tarea | T1 — Revisar los documentos y acuerdos del proyecto |
| Responsable documental | Diego Alonso Coronel Vargas (DA) |
| Inicio previsto | 1 de septiembre de 2026 |
| Fin previsto | 2 de septiembre de 2026 |
| Preparación de este registro | 18 de noviembre de 2026 |
| Estado | Revisión y acuerdos documentados; pendiente de revisión del usuario |

Las fechas previstas se conservan del cronograma. No acreditan ejecución en esas fechas. Este registro no certifica firmas, sesiones clínicas, pruebas ni aprobaciones que no se hayan realizado.

## Objetivo y resultado

Reunir las reglas de alcance, fechas, responsables, calidad y entrega que guiarán la implementación. Se revisó la suite documental y se incorporaron las decisiones expresas del usuario. No se desarrolla funcionalidad en T1.

## Fuentes revisadas

1. Charter_v3.pdf.
2. Declaracion_del_Alcance.pdf.
3. Diccionario_EDT.pdf.
4. VCS-PMP-001_Plan_Integrador_Maestro_v2.1.pdf.
5. Fechas_cronograma.pdf, versión 2.0 con 52 tareas.
6. Cronograma_vetcare.pdf, exportación aportada como referencia visual del cronograma MPP.
7. VCS-RES-001_Plan_Gestion_Recursos.pdf.
8. VCS-RES-002_Estimacion_Recursos_Actividades.pdf.
9. VCS-STK-001_Plan_Involucramiento_Interesados.pdf.
10. Plan_Gestion_Calidad.pdf.
11. VCS-CST-001_Plan_Gestion_Costos.pdf.
12. VCS-PROC-001_Plan_Gestion_Adquisiciones.pdf.
13. VCS_Identificacion_Riesgos.pdf.
14. VCS_Analisis_Cualitativo_Riesgos.pdf.
15. VCS_Analisis_Cuantitativo_Riesgos.pdf.
16. VCS_Plan_Gestion_Riesgos.pdf.
17. VCS_Plan_Respuesta_Riesgos.pdf.
18. Seis fotografías de formatos físicos, carnet y material de identidad de la clínica.

El archivo MPP nativo no se ha procesado. Las fechas y asignaciones se toman de Fechas_cronograma.pdf; los hitos vigentes se contrastan con el Plan Integrador Maestro v2.1. Las decisiones expresas del usuario indicadas abajo prevalecen para la ejecución de este trabajo, sin modificar los PDF originales.

## Alcance funcional confirmado

- Propietarios: datos de contacto, relación con pacientes y baja lógica.
- Pacientes: identificación, especie, raza, edad, nacimiento y peso según los formatos y los requisitos.
- Consultas: fecha, peso, temperatura, frecuencia cardíaca, frecuencia respiratoria, diagnóstico, tratamiento y observaciones.
- Historial clínico y seguimiento por fecha, aplicación y observaciones.
- Carnet de vacunas y desparasitación; próxima fecha opcional indicada por el veterinario. No se inventan calendarios clínicos ni intervalos automáticos.
- Usuarios con roles administrador y veterinario; permisos detallados se definirán en T12.
- Captura y consulta offline en Windows, cola de operaciones e intercambio mediante API al recuperar conexión.
- Last-Write-Wins con historial de versiones desplazadas, desempate determinista y revisión manual cuando corresponda.
- Snapshot local por guardado de consulta y restauración sin sobrescritura silenciosa.

Se excluyen inventario, farmacia, caja, facturación, aplicaciones móviles nativas, acceso directo de propietarios, migración masiva de papel y presión arterial. El campo PA aparece en la hoja física, pero sigue excluido por el alcance. La web móvil requiere internet.

## Responsables

| Clave | Integrante | Área |
| --- | --- | --- |
| DA | Diego Alonso Coronel Vargas | Gestión, frontend, integración y manual |
| PC | Priscila Cortés Ramírez | Backend, API, permisos y sincronización |
| OD | Oscar Aarón Delgadillo Fernández | Arquitectura de datos, infraestructura, respaldos y despliegue |
| BG | Brandon García Ordaz | Requisitos, Product Owner, QA y pruebas de campo |
| CN | Dr. Carlos E. Nieto Osorio | Validación clínica y aceptación |
| ER | Efren Rolando Romero Leon | Sponsor académico |

Decisiones del usuario: T25 corresponde a PC, del 9 al 16 de octubre; T43 permanece a cargo de BG, del 9 al 10 de noviembre. No se transfieren automáticamente otras tareas ni sus responsabilidades.

## Hitos vigentes

Todas las fechas corresponden a 2026.

| Hito | Fecha | Referencia |
| --- | --- | --- |
| H1 — Requisitos aprobados | 14 de septiembre | T7 |
| H2 — Diseño aprobado | 23 de septiembre | T14 |
| H3 — Núcleo local | 16 de octubre | T25 |
| H4 — Carnet y web | 22 de octubre | T29 |
| H5 — Integración y congelamiento | 9 de noviembre | T42 |
| Sesión de campo 1 | 10 al 13 de noviembre | T44 |
| Sesión de campo 2 | 16 al 20 de noviembre | T46 |
| H6 — Cierre de pruebas | 23 de noviembre | T48 |
| H7 — Entrega final | 27 de noviembre | T52 |

Se usa el 27 de noviembre como fecha final vigente frente al 29 de noviembre histórico del charter. Después de H5, los entregables de esa etapa se limitan a correcciones salvo excepción acordada.

El usuario aceptó mantener H3 para persistencia offline y completar snapshots en T36 (20 al 29 de octubre), verificándolos antes de H5. H3 no se presentará como evidencia de snapshots completos.

## Arquitectura y despliegue acordados

| Componente | Decisión |
| --- | --- |
| Interfaz | HTML, CSS y JavaScript; web responsiva |
| Backend | PHP 8.x; runtime comunitario vercel-php en Vercel |
| Base central | MariaDB en alwaysdata, propuesta para la demostración académica |
| Escritorio | Electron para Windows |
| Base local | SQLite en el almacenamiento de cada instalación |
| Distribución de escritorio | Instalador Windows; publicación del instalador prevista mediante releases de GitHub |

El navegador y Electron acceden al servidor por API HTTPS, nunca mediante credenciales directas de MariaDB. Solo el backend conserva las credenciales de conexión. SQLite y snapshots locales no se alojan como archivos persistentes dentro de Vercel Functions.

La elección de Vercel y servicios gratuitos es expresa del usuario. Quedan por verificar el runtime PHP, el acceso externo cifrado a MariaDB, los límites de conexiones y las condiciones de los planes. No hay servicios creados ni compatibilidad validada todavía. Si aparece un bloqueo, se informará antes de cambiar el stack.

La aplicación web estará alojada en la nube, independiente del equipo del usuario. No se promete disponibilidad garantizada en planes gratuitos. La modalidad gratuita personal de alwaysdata es para el prototipo académico; una implementación operativa de la clínica requiere un plan que permita ese uso.

## Diseño e interacción

Estilo simple, intuitivo, minimalista y profesional, inspirado en la identidad aportada: verde bosque, verde oliva, marfil, dorado y terracota. Valores iniciales aproximados: #26352A, #708447, #F7F5ED, #BEA052 y #A77B59. Se validarán en prototipos T10/T11, cuidando contraste y legibilidad.

Formularios por secciones, orden cercano a la hoja clínica, botones claros, poca escritura repetitiva y estados visibles de guardado y sincronización. Se prioriza Chrome en Windows y Android; se prevén pruebas adicionales en Safari de iOS y navegadores modernos. No se declara compatibilidad universal sin pruebas.

## Calidad y evidencias

- Mantener la cadena requisito RE01–RE22 → caso ES-01–ES-22 → resultado y evidencia.
- Casos obligatorios aprobados antes de H5; cero bloqueantes al cierre H6.
- Tres mediciones individuales de historial, cada una menor a 30 segundos; series de caché fría y caliente separadas. El promedio no sustituye el criterio.
- Verificar sincronización, reintentos, conflictos, conservación de versiones y restauración en entorno controlado.
- Objetivo de usabilidad: al menos 90 % de tareas críticas sin ayuda.
- Usar datos ficticios en desarrollo y demostración. Las pruebas escolares se identifican como tales; las firmas y resultados clínicos solo se registran cuando existan.
- No guardar secretos, datos clínicos reales ni snapshots reales en Git.

Los documentos de riesgos identifican doce amenazas activas y dos asuntos en verificación (R6 y R9). Sus probabilidades y escenarios son estimaciones, no incidentes ni resultados ejecutados. Los riesgos no se cierran solo por escribir una respuesta.

## Forma de trabajo

1. Seleccionar una tarea habilitada por sus dependencias.
2. Identificar responsable, fechas documentales, requisito y entregable.
3. Preparar solo el alcance de esa tarea y verificarlo de forma adecuada.
4. Presentar archivos, resultado, limitaciones y mensaje de commit sugerido.
5. El usuario revisa y realiza sus commits; no se crean commits ni se cambian sus fechas automáticamente.

La prioridad de seguimiento son días, responsables y dependencias. Las horas permanecen como referencia de los documentos, sin usarlas para bloquear la ejecución solicitada. El presupuesto documentado no equivale a gasto real: se prioriza costo cero y no se contratan servicios de pago automáticamente.

## Pendientes por etapa

| Momento | Pendiente |
| --- | --- |
| T2–T7 | Consolidar participantes, flujo, campos obligatorios y backlog a partir de las fuentes aportadas |
| T8/T9 | Definir arquitectura detallada, entidades y relaciones, identificadores y versionado |
| T10/T11 | Validar pantallas y uso del logotipo a partir del material disponible |
| T12 | Matriz detallada de permisos y comportamiento de autenticación offline |
| T13 | Diseño de guardado y recuperación; snapshots, retención y restauración |
| T15/T18 | Prueba mínima de PHP en Vercel y conexión cifrada a MariaDB; cuentas de despliegue |
| T35 | Desempate LWW, relojes desalineados y conservación verificable de conflictos |
| Pruebas | Matriz concreta de equipos/navegadores y evidencias reales de cada ejecución |

Estos pendientes corresponden a tareas futuras y no impiden cerrar la revisión documental T1. No equivalen a aprobaciones clínicas o académicas.

## Criterios de cierre de T1

- [x] Identificar las fuentes de gestión y los formatos físicos aportados.
- [x] Consolidar alcance, exclusiones y decisiones del usuario.
- [x] Identificar responsables e hitos vigentes.
- [x] Registrar discrepancias relevantes y su tratamiento acordado.
- [x] Registrar riesgos técnicos de despliegue y pendientes por etapa.
- [ ] Revisión del usuario de este registro.

Siguiente tarea: T2 — Identificar a los participantes y sus necesidades; responsable BG; ventana documental del 1 al 3 de septiembre de 2026.
