# T10 — Diseñar las pantallas principales de escritorio

## Identificación

| Dato | Valor |
| --- | --- |
| Fase | 3.0 — Diseño de arquitectura e interfaz |
| Responsable documental | Diego Alonso Coronel Vargas (DA) |
| Inicio previsto | 14 de septiembre de 2026 |
| Fin previsto | 17 de septiembre de 2026 |
| Preparación del prototipo | 18 de noviembre de 2026 |
| Estado | Prototipo navegable preparado; revisión visual y de usuario pendiente |

Las fechas previstas se conservan del cronograma. El prototipo no es la aplicación Electron terminada, no implementa autenticación ni persistencia y no acredita pruebas clínicas. Es una entrega de diseño con código HTML/CSS/JS para explorar las pantallas antes de T17.

## Entregables y apertura

- [Prototipo navegable](prototipo_escritorio/index.html).
- [Estilos](prototipo_escritorio/styles.css).
- [Interacciones y datos ficticios](prototipo_escritorio/app.js).

Abrir index.html en Chrome o Edge manteniendo styles.css y app.js en la misma carpeta. No requiere instalar paquetes, crear cuentas ni conectarse a internet. También puede servirse localmente para revisión; ese servidor temporal no es el alojamiento definitivo de VetCare.

Insumos: [T3](../gestion/T03_revision_formatos_medicos.md), [T4](../gestion/T04_proceso_atencion.md), [T5](../gestion/T05_funciones_condiciones.md), [T8](../arquitectura/T08_arquitectura_sistema.md) y [T9](../arquitectura/T09_modelo_datos.md). Los campos y relaciones aún candidatos siguen sujetos a D-T5-01/02/03; el diseño no los aprueba implícitamente.

## Dirección visual

Interfaz clínica sobria, con navegación lateral persistente, contenido de lectura sobre blanco y fondo cálido. La paleta interpreta las fotografías; no se presenta como extracción colorimétrica exacta de la identidad impresa.

| Elemento | Tratamiento |
| --- | --- |
| Principal | Verde bosque #26352A |
| Secundario | Oliva #63763C; adaptación para lectura sobre fondos claros |
| Fondos cálidos | Marfil #F7F5ED |
| Acento | Dorado #BEA052, para marca y detalles, sin depender de él para comunicar estados |
| Complementario | Terracota #9C7051, utilizado de forma secundaria |
| Tipografía | Segoe UI y alternativas del sistema, sin descarga externa |
| Superficies | Tarjetas y tablas con bordes suaves, radios discretos y espacios amplios |
| Iconografía | SVG local; icono provisional de huella, sin afirmar que sea el logotipo oficial |
| Interacción | Acciones con texto, foco visible, etiquetas y estados diferenciados por texto además de color |

No se utiliza la ilustración decorativa del carnet como fondo de los formularios. El logotipo definitivo puede integrarse desde una fuente de mejor calidad en la implementación; el material aportado no se reemplaza por una falsa reproducción oficial.

## Mapa de pantallas

| ID | Pantalla | Contenido y acción principal | Cobertura |
| --- | --- | --- | --- |
| UI-T10-01 | Pacientes | Directorio, búsqueda por paciente/raza/propietario, filtros por especie, acceso a ficha y alta de ejemplo | RE02, RE05 |
| UI-T10-02 | Propietarios | Contacto, localidad, pacientes vinculados y alta de ejemplo | RE01 |
| UI-T10-03 | Expediente | Identificación, propietario, historial de consultas, referencia de peso y acceso al carnet | RE03, RE05 |
| UI-T10-04 | Nueva consulta | Fecha, mediciones opcionales, diagnóstico/motivo, tratamiento, observaciones y confirmación de ejemplo | RE03, RE11 |
| UI-T10-05 | Carnet sanitario | Separación de vacunas y desparasitación, fecha y próxima fecha opcional | RE04 |
| UI-T10-06 | Seguimiento | Pestaña con explicación y estado vacío de diseño; no formulario operativo | RE03, decisión candidata D-T5-01 |

Los formularios de alta de propietario y paciente se abren como diálogos. El alta de paciente usa los campos mínimos candidatos y raza; edad y nacimiento, edición, baja y reactivación se detallarán en los formularios de implementación. No se declara el ciclo CRUD completo por tener un diálogo de alta.

## Flujos de interacción preparados

1. Buscar un paciente y filtrar por especie; mostrar un estado vacío si no hay coincidencias.
2. Abrir ficha desde el directorio o desde los pacientes vinculados a un propietario.
3. Cambiar entre historial, seguimiento y carnet sin perder el paciente seleccionado.
4. Abrir nueva consulta con paciente preseleccionado y fecha ficticia de la demostración.
5. Capturar un diagnóstico/motivo de ejemplo, mediciones opcionales y notas; añadir la consulta al historial en memoria.
6. Utilizar “Cancelar” en una consulta con texto para solicitar confirmación antes de descartarla.
7. Crear propietario y paciente de ejemplo en memoria; reutilizar el propietario al crear un paciente.
8. Cambiar entre vista conectada y desconectada simuladas para explorar mensajes de estado. El control no modifica la red real ni sincroniza datos.

Los mensajes de guardado explican que el cambio solo existe en la vista y se reinicia al recargar. Los estados confirmados/pendientes de las filas están etiquetados como ejemplos, no como una confirmación de servidor. No hay acciones de edición o eliminación que aparenten ejecutar cambios reales.

## Detalle de nueva consulta

| Sección | Campos | Consideración |
| --- | --- | --- |
| Identificación | Paciente de solo lectura y fecha | La consulta pertenece al paciente seleccionado |
| Mediciones | Peso kg, temperatura °C, FC latidos/min, FR respiraciones/min | Opcionales según propuesta T5; vacíos no se sustituyen por ceros |
| Valoración | Diagnóstico/motivo | Requerido candidato; no generar texto clínico automáticamente |
| Indicaciones | Tratamiento | Texto opcional, sin calcular dosis |
| Notas | Observaciones | Texto opcional |
| Acciones | Cancelar y guardar en la vista | Confirmación de descarte al cancelar con captura; guardado solo en memoria |

PA no está presente. La fecha inicial del prototipo y las mediciones de los datos de muestra son ficticias; la implementación debe utilizar la política acordada y la fecha del contexto real, sin copiar la fecha fija de esta maqueta.

## Estados y accesibilidad

- Navegación con indicación de página actual y títulos de pantalla.
- Campos etiquetados, controles nativos, mínimos indicados con asterisco y opcionales con texto.
- Modal con título, cierre explícito y comportamiento nativo de dialog.
- Mensajes de resultado mediante región de estado y errores con región de alerta.
- Foco visible en botones, enlaces y campos; no depender de hover para conocer una acción.
- Resultados vacíos para directorio y expedientes sin consultas de muestra.
- Información del paciente visible en expediente y en el encabezado de la consulta.

La validación nativa y las comprobaciones locales son ilustrativas. T17/T19/T23 deben implementar validaciones completas, permisos, errores reales y guardado seguro. Queda por verificar con navegador/teclado la navegación integral, contraste cuantitativo y lectura con tecnología asistiva; no se declara conformidad de accesibilidad a partir del CSS.

## Alcance técnico de esta maqueta

HTML/CSS/JavaScript sin dependencias remotas. Datos ficticios mantenidos en arrays durante la sesión de página. La búsqueda y los formularios insertan texto escapado al construir las vistas; no se procesan datos clínicos reales.

No hay autenticación, autorización, SQLite, MariaDB, API, snapshots, sincronización, instalador ni almacenamiento persistente. No se carga una librería clínica ni se generan pautas médicas. El carnet usa dos eventos de ejemplo para mostrar la diferencia entre próxima fecha indicada y ausencia de fecha.

Los estilos incluyen una adaptación básica para ventanas estrechas para que la maqueta no quede inutilizable al reducir la ventana. T11 sigue siendo la tarea específica de diseño móvil; T10 no acredita pruebas de Android/iOS ni compatibilidad de la aplicación final.

## Verificación realizada y pendiente

| Comprobación | Estado |
| --- | --- |
| Sintaxis JavaScript con node --check | Correcta |
| Existencia de recursos HTML/CSS/JS y enlaces documentales | Comprobada en esta entrega |
| Estructura HTML, referencias SVG y duplicación de IDs estáticos | Comprobada mediante análisis estático |
| Apariencia visual en navegador | Pendiente: la herramienta de navegador devolvió un bloqueo de sesión al abrir el servidor local |
| Ejecución de búsqueda, diálogos, formularios y navegación | Interacciones implementadas, pero prueba real en navegador pendiente por ese bloqueo |
| Persistencia, permisos y sincronización | No aplican como implementación a T10; tareas posteriores |

Guion de revisión del usuario: abrir index.html; buscar “Luna”; abrir su ficha; revisar carnet y ambas pestañas; volver; crear una consulta de ejemplo; comprobar que aparece en historial; recargar y comprobar que los datos añadidos desaparecen, conforme al aviso. Repetir con nuevo propietario y paciente. Estos pasos son una guía de verificación, no resultados ejecutados.

## Criterios de cierre y siguiente tarea

- [x] Preparar prototipo navegable con la identidad visual propuesta.
- [x] Diseñar pantallas principales de pacientes, propietarios, expediente, consulta y carnet.
- [x] Identificar campos candidatos, estados vacíos y alcance de las interacciones.
- [x] Separar visualización de ejemplo de funciones reales y datos persistentes.
- [x] Comprobar sintaxis y referencias estáticas.
- [ ] Revisar apariencia e interacciones en navegador.
- [ ] Recibir observaciones de diseño para incorporarlas a la revisión conjunta T14.

Resultado: T10 preparada para revisión visual; no se declara aprobación de diseño ni implementación del sistema clínico.

Siguiente tarea: T11 — Diseñar las pantallas para dispositivos móviles; responsable Diego Alonso Coronel Vargas; ventana documental del 15 al 18 de septiembre de 2026.
