# T3 — Revisar los formatos médicos utilizados en la clínica

## Identificación

| Dato | Valor |
| --- | --- |
| Proyecto | VetCare System (VCS), Veterinaria La Vaquita Pinta |
| Fase / paquete | 2.0 — Planeación y requerimientos / 2.1 — Levantamiento |
| Tarea | T3 — Revisar los formatos médicos utilizados en la clínica |
| Responsable documental | Brandon García Ordaz (BG) |
| Inicio previsto | 2 de septiembre de 2026 |
| Fin previsto | 4 de septiembre de 2026 |
| Preparación del registro | 18 de noviembre de 2026 |
| Estado | Revisión de las fotografías completada; reglas clínicas pendientes de validación |

Las fechas previstas se conservan del cronograma. El análisis procede de las fotografías y documentos aportados, sin atribuir visitas, entrevistas o validaciones clínicas no realizadas.

## Objetivo y fuentes

Identificar los campos visibles, el orden de captura, los datos repetidos y las diferencias respecto del alcance para alimentar T4 (proceso de atención), T5 (funciones y condiciones) y T9 (modelo de datos). No se crean pantallas, tablas SQL, calendarios clínicos ni reglas de obligatoriedad definitivas en esta tarea.

Fuentes: seis fotografías adjuntas del usuario; Declaracion_del_Alcance.pdf, secciones 1 y 4; Diccionario_EDT.pdf, paquetes 4.2.1, 4.2.2, 4.3, 5.1 y 5.4; Plan_Gestion_Calidad.pdf, escenarios ES-01 a ES-05 y ES-11; registro T1 y participantes/necesidades T2. El usuario confirmó que la próxima aplicación es opcional y la indica el veterinario.

## Inventario de evidencia visual

Los códigos IMG-T3 describen las seis fotografías en el orden de su envío; no son formatos adicionales ni archivos nuevos.

| Evidencia | Contenido visible | Uso del análisis |
| --- | --- | --- |
| IMG-T3-01 | Frente de tarjeta de la clínica, portada del carnet y fragmento de hoja clínica | Identidad, paleta y contexto; la hoja completa se revisa en IMG-T3-03 |
| IMG-T3-02 | Reverso de tarjeta con contacto, horarios y servicios | Referencia de identidad; no convierte servicios publicitados en módulos del sistema |
| IMG-T3-03 | Hoja clínica completa con encabezado, diagnóstico, tratamiento y tabla inferior | Campos y orden de consulta y seguimiento |
| IMG-T3-04 | Portada de “Mi carnet de Vacunación” y fragmento de hoja clínica | Nombre de la clínica, logotipo y referencia visual |
| IMG-T3-05 | Página “Desparasitaciones” | Columnas del registro sanitario |
| IMG-T3-06 | Identificación “Me llamo” y “Calendario de Vacunación” | Datos de paciente y propietario; columnas de vacunación |

Se identifican cuatro bloques de captura: hoja clínica, identificación del carnet, vacunación y desparasitación. Las tarjetas y la portada son referencias institucionales. No se dispone de un manual de llenado ni de ejemplares completados que aclaren todos los encabezados.

## 1. Hoja clínica y seguimiento

### Orden visible

1. Fecha.
2. Propietario y teléfono.
3. Mascota, raza, edad y peso.
4. PA, FR, FC y temperatura.
5. Diagnóstico.
6. Tratamiento.
7. Tabla de seguimiento: fecha, aplicación y observaciones.

En la digitalización se conservará esa agrupación general, retirando PA por la exclusión expresa y permitiendo seleccionar propietario y paciente ya registrados. El significado de FR y FC se expande con ayuda del alcance documental.

| ID | Etiqueta física | Interpretación y destino propuestos | Tipo de dato conceptual | Fuente / condición |
| --- | --- | --- | --- | --- |
| HC-01 | Fecha | Fecha de la consulta | Fecha | Visible; no confundir con fecha técnica de creación o sincronización |
| HC-02 | Propietario | Referencia al propietario registrado | Relación | Visible; no duplicar una entidad por cada consulta |
| HC-03 | Teléfono | Contacto del propietario | Texto | Visible; no usar número aritmético para conservar prefijos y formato |
| HC-04 | Mascota | Paciente seleccionado y su nombre | Relación y texto | Visible; usar “Paciente” en la navegación para cubrir animales de granja |
| HC-05 | Raza | Raza del paciente | Texto | Visible; política de catálogo o texto a definir después |
| HC-06 | Edad | Edad al momento de atención | Valor y unidad, o dato derivado | Visible; tratamiento de edad aproximada pendiente |
| HC-07 | Peso | Peso observado en esa consulta | Decimal y unidad | Visible; no reemplazar pesos históricos con el último valor |
| HC-08 | PA | Campo físico excluido del sistema | No aplica | Presión arterial fuera de alcance; no incluir en UI, esquema ni pruebas obligatorias |
| HC-09 | FR | Frecuencia respiratoria de la consulta | Número y unidad explícita | Visible; significado confirmado por el alcance |
| HC-10 | FC | Frecuencia cardíaca de la consulta | Número y unidad explícita | Visible; significado confirmado por el alcance |
| HC-11 | Temperatura | Temperatura de la consulta | Decimal y unidad explícita | Visible; unidad y validaciones a especificar en T5 |
| HC-12 | Diagnóstico | Diagnóstico registrado por el veterinario | Texto multilínea | Visible; no generar diagnósticos automáticamente |
| HC-13 | Tratamiento | Tratamiento indicado por el veterinario | Texto multilínea | Visible; sin prescripción o cálculo automático de dosis |
| HC-14 | Fecha (tabla) | Fecha de cada registro de seguimiento | Fecha | Visible; relación con consulta o episodio a precisar en T4 |
| HC-15 | Aplicación (tabla) | Descripción de una aplicación o intervención registrada | Texto, propuesta inicial | Encabezado visible; significado exacto por confirmar, no es próxima fecha |
| HC-16 | Observaciones (tabla) | Notas de cada seguimiento | Texto multilínea | Visible |
| HC-17 | Observaciones de consulta | Notas generales de la consulta | Texto multilínea | Exigido por RE03 aunque no aparece como bloque independiente en la hoja |

La hoja tiene filas limitadas por el espacio físico. Ese número no se interpreta como máximo de seguimientos digitales. Diferenciar observaciones generales de consulta y notas del seguimiento evita mezclar fechas y acontecimientos.

## 2. Identificación del carnet

### Orden visible

“Me llamo”, especie, raza, edad, fecha de nacimiento, propietario, domicilio y localidad. El nombre del paciente se identifica por el encabezado “Me llamo”, aunque no haya una etiqueta separada “Nombre”.

| ID | Etiqueta física | Destino propuesto | Tipo conceptual | Consideración |
| --- | --- | --- | --- | --- |
| ID-01 | Me llamo | Nombre o identificación del paciente | Texto | No usar como identificador único: puede repetirse entre animales |
| ID-02 | Especie | Especie del paciente | Selección con opción otras | Perros, gatos, caballos, vacas y borregos están en el alcance; no limitar a perro/gato por la ilustración |
| ID-03 | Raza | Raza del paciente | Texto | Mismo dato que HC-05; no mantener copias independientes |
| ID-04 | Edad | Edad conocida o estimada | Valor y unidad / cálculo | Mismo concepto que HC-06; no exigir nacimiento exacto para toda edad aproximada |
| ID-05 | Fecha de Nacimiento | Nacimiento conocido del paciente | Fecha opcional propuesta | No inventar una fecha exacta a partir de una edad aproximada |
| ID-06 | Propietario | Referencia al propietario | Relación | Mismo concepto que HC-02; un propietario puede tener varios pacientes |
| ID-07 | Domicilio | Domicilio del propietario | Texto | Evitar repetirlo en cada consulta; cambios de domicilio y necesidad de historial a precisar |
| ID-08 | Localidad | Localidad del propietario | Texto | Mantener separada del domicilio por ser un campo distinto |

La combinación edad/nacimiento exige una política consistente: calcular edad cuando exista nacimiento conocido y permitir representar una estimación cuando no exista. Esta es una propuesta para T5, no una regla clínica aprobada. La edad histórica de una consulta no debe cambiar visualmente por el paso del tiempo como si fuera una observación nueva.

## 3. Calendario de vacunación

La fotografía muestra columnas “Vacuna”, “Fecha” y “Aplicación”. No se observa una columna independiente de próxima aplicación.

| ID | Campo | Origen | Tratamiento propuesto |
| --- | --- | --- | --- |
| VA-01 | Vacuna | Etiqueta visible | Nombre o descripción de la vacuna; sin imponer catálogo clínico todavía |
| VA-02 | Fecha | Etiqueta visible | Fecha registrada del evento de vacunación; no confundir con recordatorio |
| VA-03 | Aplicación | Etiqueta visible | Conservar el concepto; confirmar si indica dosis de la serie, anotación, firma u otro dato antes de fijar su significado |
| VA-04 | Próxima aplicación | RE04 y aclaración del usuario | Fecha opcional elegida por el veterinario; vacía significa “Sin fecha programada” |

No deducir intervalos por especie ni por nombre de vacuna. No convertir “Aplicación” automáticamente en “Próxima aplicación” ni asumir que significa vía de administración. Los recordatorios locales se muestran únicamente cuando se indica una próxima fecha.

## 4. Desparasitación

La página muestra el título “Desparasitaciones” y las columnas “Helmítico”, “Peso” y “Fecha”, según la etiqueta legible de la fotografía. La denominación impresa del producto debe confirmarse antes de fijar el texto final; no se modifica una regla clínica para corregir una etiqueta editorial.

| ID | Campo | Origen | Tratamiento propuesto |
| --- | --- | --- | --- |
| DE-01 | Helmítico | Etiqueta visible | Nombre o descripción del producto desparasitante; propuesta de etiqueta digital: “Desparasitante” |
| DE-02 | Peso | Etiqueta visible | Peso asociado al evento, con unidad; no usarlo para calcular dosis automáticamente |
| DE-03 | Fecha | Etiqueta visible | Fecha del registro de desparasitación |
| DE-04 | Próxima aplicación | RE04 y aclaración del usuario | Fecha opcional indicada por el veterinario, con el mismo comportamiento que VA-04 |

El calendario helmíntico previsto en los documentos se entiende aquí como registro y seguimiento de desparasitaciones. La pauta y sus fechas las establece el veterinario. No se crea un programa sanitario automático.

## 5. Datos compartidos y relaciones conceptuales

| Información | Lugar de mantenimiento propuesto | Reutilización |
| --- | --- | --- |
| Nombre, teléfono, domicilio y localidad del propietario | Registro de propietarios | Selección desde paciente y consulta, sin repetir captura de datos de contacto |
| Nombre, especie, raza y nacimiento/edad del paciente | Registro de pacientes | Cabecera de expediente y carnet |
| Fecha, peso, constantes, diagnóstico, tratamiento y notas | Cada consulta | Historial cronológico |
| Fecha, aplicación y observaciones de seguimiento | Registro de seguimiento relacionado | Detalle de la atención; vínculo concreto a definir en T4/T9 |
| Vacuna, fecha y dato de aplicación | Cada registro de vacunación | Carnet e historial del paciente |
| Producto, fecha y peso de desparasitación | Cada registro de desparasitación | Carnet e historial del paciente |
| Próxima fecha | Cada evento sanitario que la tenga | Recordatorios en pantalla |

Relaciones mínimas documentadas: propietario con varios pacientes; paciente con varias consultas, vacunaciones y desparasitaciones. No se incorpora una relación de múltiples propietarios por paciente sin aclaración de alcance. El esquema SQL, los identificadores, las marcas de tiempo y las versiones pertenecen a T9 y a las tareas técnicas correspondientes.

El peso de una consulta y el de una desparasitación son observaciones situadas en eventos distintos: no se asumen iguales ni se actualizan retrospectivamente en conjunto. La eventual visualización de “último peso” debe conservar la fecha y fuente del valor.

## 6. Diferencias entre formato físico y alcance digital

| Hallazgo | Resolución o siguiente paso | Estado |
| --- | --- | --- |
| La hoja contiene PA | Excluir presión arterial conforme a RE03 y al acuerdo de T1 | Resuelto por alcance |
| La próxima aplicación no aparece como columna visible independiente | Añadir fecha opcional por RE04 y decisión del usuario | Acordado |
| Existe teléfono en consulta y domicilio/localidad en carnet | Mantener contacto en propietario y reutilizarlo | Propuesta de organización para T5/T9 |
| Edad y nacimiento aparecen juntos | Diferenciar edad calculada y estimada; no inventar nacimiento | Política pendiente de T5 |
| “Aplicación” tiene un significado no explicado | Conservar el dato, no asignar semántica de dosis, firma o vía sin validación | Pendiente P-T3-01 |
| Observaciones se muestran en la tabla inferior; RE03 también exige notas por consulta | Distinguir notas de consulta y seguimiento | Propuesta para T4/T5 |
| Las fotografías anuncian rayos X, ultrasonido y estética | Referencia institucional, sin crear módulos nuevos | Resuelto por alcance |
| La portada muestra perros y gatos | Mantener soporte multiespecie del alcance | Resuelto por alcance |
| El papel tiene número fijo de filas | Permitir registros repetidos sin inferir un límite a partir del papel | Propuesta de interacción |
| No hay marcas de obligatoriedad visibles | No presentar los campos como obligatorios solo por aparecer impresos | Pendiente de T5 |

## 7. Validaciones propuestas, pendientes de especificación

Estas son reglas de integridad de captura para trabajar en T5; no sustituyen criterios veterinarios ni se presentan como requisitos ya aprobados.

- Permitir seleccionar propietario y paciente existentes, con relación válida y sin usar solo el nombre como clave.
- Tratar el teléfono como texto; conservar prefijos y no rechazar un formato válido por un patrón excesivamente restrictivo.
- Distinguir datos desconocidos de valores numéricos iguales a cero. No rellenar constantes ausentes automáticamente.
- Mostrar unidades de peso, temperatura y frecuencias; definir unidades y conversión antes de validar rangos.
- No fijar rangos fisiológicos universales para especies diferentes. Las condiciones clínicas y cualquier advertencia deben validarse con la clínica; su definición sigue pendiente.
- Revisar que una fecha de nacimiento conocida no sea posterior a la fecha de atención del evento correspondiente.
- Permitir registrar consultas y aplicaciones pasadas a demanda: no confundirlo con una migración masiva de papel.
- Mantener opcional la próxima aplicación; definir en T5 su relación con la fecha del evento y la política de correcciones de fechas.
- Conservar texto clínico y saltos de línea dentro de límites técnicos a definir; no eliminar información al sincronizar o editar.
- Aplicar reglas coherentes en escritorio y servidor. El comportamiento offline y la recuperación se diseñan en sus tareas específicas.

## 8. Implicaciones de diseño para los prototipos

1. Cabecera con identificación del paciente y acceso a su propietario, sin repetir toda la captura de contacto en cada consulta.
2. Consulta por bloques: fecha e identificación; mediciones; diagnóstico; tratamiento; notas; seguimiento.
3. Carnet con secciones claras de vacunas y desparasitaciones. En celular, reemplazar tablas anchas por filas o tarjetas legibles sin ocultar campos esenciales.
4. Campo de próxima aplicación opcional, con estado visible “Sin fecha programada”; no utilizar una fecha ficticia para representar ausencia.
5. Listados cronológicos, búsqueda de pacientes y estados claros de guardado y sincronización, conforme al alcance.
6. Paleta y logotipo inspirados en el material aportado; fondos sobrios, contraste legible y controles amplios. El análisis de las fotografías no obliga a reproducir patrones decorativos o la composición de una página impresa en la interfaz.

El prototipado corresponde a T10 y T11. T3 no agrega impresión, exportación PDF del carnet, firma digital, adjuntos clínicos ni reconocimiento automático de formularios: esas funciones no se deducen de las fotos.

## 9. Trazabilidad inicial con necesidades y pruebas

| Bloque | Necesidades T2 | Requisitos existentes | Escenarios a concretar más adelante |
| --- | --- | --- | --- |
| Propietario y datos de contacto | NEC-T2-01 | RE01 | ES-01 |
| Identificación multiespecie | NEC-T2-01 | RE02 | ES-02 |
| Consulta y seguimiento | NEC-T2-02 | RE03, RE05 | ES-03, ES-05 |
| Carnet sanitario y próxima fecha opcional | NEC-T2-05 | RE04 | ES-04, incluidos eventos con y sin próxima fecha |
| Orden y legibilidad de captura | NEC-T2-06, NEC-T2-07 | RE10, RE11, RE16 | ES-10, ES-11, ES-16 |
| Persistencia del contenido digitalizado | NEC-T2-03, NEC-T2-04 | RE06, RE07, RE08, RE09, RE14 | ES-06 a ES-09 y ES-14 |

La trazabilidad es una relación documental. No indica que los escenarios estén ejecutados o aprobados.

## 10. Pendientes y criterio de resolución

| ID | Dato por aclarar | Cuándo debe resolverse | Tratamiento provisional |
| --- | --- | --- | --- |
| P-T3-01 | Significado exacto de “Aplicación” en vacunación y seguimiento | T4/T5, antes de cerrar los formularios | No deducir que equivale a próxima fecha, dosis, firma o vía; describirlo como dato por confirmar |
| P-T3-02 | Obligatoriedad de datos de contacto, identificación y mediciones clínicas | T5 | Separar mínimos propuestos de reglas aprobadas; admitir que una medición puede ser desconocida |
| P-T3-03 | Edad estimada, nacimiento conocido y presentación de edad histórica | T5/T9 | No convertir una estimación en nacimiento exacto |
| P-T3-04 | Unidades de medición y criterios de rango por especie | T5, antes de programar validaciones clínicas | No inventar rangos ni valores clínicos predeterminados |
| P-T3-05 | Relación de las filas de seguimiento con una consulta o un episodio | T4/T9 | Conservar fecha, descripción y observaciones; definir relación antes del esquema definitivo |
| P-T3-06 | Texto final del encabezado del producto desparasitante | T5/T10 | Proponer “Desparasitante” sin asumir una pauta o catálogo |

El usuario puede definir convenciones para la demostración escolar. Antes de uso real, las reglas clínicas deben contrastarse con el representante de la clínica. Estos puntos no impiden terminar la revisión visual; sí limitan la definición definitiva de campos y reglas de etapas posteriores.

## Criterios de cierre y siguiente tarea

- [x] Inventariar las seis fotografías y distinguir formatos de material institucional.
- [x] Identificar cuatro bloques de captura, etiquetas y orden visible.
- [x] Registrar datos compartidos y relaciones conceptuales sin anticipar el esquema SQL.
- [x] Contrastar PA, próxima aplicación, especies y servicios publicitados con el alcance.
- [x] Separar campos visibles, campos exigidos por documentos y propuestas pendientes.
- [x] Registrar dudas que requieren resolución antes de programar.
- [x] Vincular los bloques con necesidades T2, requisitos y pruebas previstas.
- [x] Conservar responsable y fechas del cronograma.

Resultado: revisión documental y visual T3 preparada. No se declara aprobación clínica de campos, obligatoriedad o validaciones.

Siguiente tarea: T4 — Conocer el proceso de atención de los veterinarios; responsable Brandon García Ordaz; ventana documental del 3 al 7 de septiembre de 2026. Se describirá el proceso propuesto a partir de la evidencia disponible, distinguiendo las inferencias de la operación confirmada.
