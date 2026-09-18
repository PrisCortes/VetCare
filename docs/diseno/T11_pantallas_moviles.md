# T11 — Diseñar las pantallas para dispositivos móviles

## Identificación

| Dato | Valor |
| --- | --- |
| Fase | 3.0 — Diseño de arquitectura e interfaz |
| Responsable documental | Diego Alonso Coronel Vargas (DA) |
| Inicio previsto | 15 de septiembre de 2026 |
| Fin previsto | 18 de septiembre de 2026 |
| Preparación del prototipo | 18 de noviembre de 2026 |
| Estado | Adaptación móvil preparada; revisión visual e interacción en dispositivos pendiente |

Las fechas previstas corresponden al cronograma, no acreditan ejecución histórica. El trabajo adapta el prototipo de T10; no acredita una aplicación móvil nativa, una instalación clínica ni funcionalidad persistente.

## Entregables

- [Vista previa móvil a 390 px](prototipo_escritorio/mobile.html): marco navegable para revisar desde una computadora.
- [Prototipo adaptable sin marco](prototipo_escritorio/index.html): responde al ancho de su ventana.
- [Estilos móviles](prototipo_escritorio/mobile.css): capa añadida sobre el diseño de T10.
- [Interacciones compartidas](prototipo_escritorio/app.js): mismos datos y acciones, con etiquetas para las tarjetas y teclados de captura sugeridos.

Abrir mobile.html manteniendo los otros archivos en la misma carpeta. El marco permite mostrar una vista estrecha desde el escritorio; no emula Android o iOS, sus teclados ni sus particularidades. Desde el teléfono, el sistema final se abrirá por HTTPS; el acceso desde una URL remota todavía no está desplegado.

## Fuentes y continuidad

Insumos: [T3 — Formatos](../gestion/T03_revision_formatos_medicos.md), [T5 — Funciones](../gestion/T05_funciones_condiciones.md), [T8 — Arquitectura](../arquitectura/T08_arquitectura_sistema.md), [T9 — Modelo](../arquitectura/T09_modelo_datos.md) y [T10 — Escritorio](T10_pantallas_escritorio.md). Se conserva la paleta inspirada en la clínica, los roles y las decisiones de próxima fecha opcional.

La base HTML/JS es común para no mantener dos prototipos divergentes. T11 agrega estilos específicos y ajustes de interacción; no duplica los formularios o conjuntos de datos. Los datos siguen siendo ficticios en memoria, con reinicio al recargar.

## Adaptaciones por pantalla

| Pantalla | Tratamiento móvil | Información preservada |
| --- | --- | --- |
| Pacientes | Filas presentadas como tarjetas; búsqueda de ancho completo y filtros desplazables | Nombre, raza, especie, propietario, atención y estado de ejemplo |
| Propietarios | Tarjetas con etiquetas y botones a los pacientes vinculados | Contacto y localidad, incluso cuando no hay datos |
| Expediente | Ficha de paciente sobre el historial, en lugar de esconderla como en el ajuste básico de T10 | Identidad, propietario, edad, peso y fuente del peso |
| Historial | Eventos en columna y fechas debajo de títulos cuando falta ancho | Contenido de consulta, procedencia ficticia y estado ilustrativo |
| Carnet | Pestañas de vacunas/desparasitación, evento en columna | Fecha del evento y próxima fecha o “Sin fecha programada” |
| Nueva consulta | Formulario de una columna, mediciones etiquetadas con unidad y acciones al final | Fecha, paciente, diagnóstico/motivo, tratamiento y observaciones |
| Alta de propietario/paciente | Diálogos limitados por altura disponible y con desplazamiento interno | Etiquetas, mínimos candidatos y acciones de guardar/cancelar |

El seguimiento sigue siendo una pestaña de estado vacío de diseño; no se declara formulario completo por adaptarla a móvil. Las propuestas de captura D-T5-01/02/03 permanecen pendientes.

## Navegación e interacción táctil

- Barra inferior con cuatro destinos: pacientes, propietarios, expediente y carnet. El seleccionado se distingue por texto, color y marca de selección.
- La barra respeta el área segura inferior y el contenido reserva espacio para no quedar debajo de ella.
- Acciones principales, pestañas, filtros y cierre de diálogos tienen áreas de interacción diseñadas con mínimos aproximados de 44 px; se requiere comprobar su tamaño real en el navegador.
- Las tablas conservan sus encabezados en el HTML y cada celda recibe una etiqueta para su presentación en tarjeta. El efecto de cambiar su presentación CSS debe comprobarse con lector de pantalla antes de declarar accesibilidad.
- Los campos se presentan a 16 px en la capa móvil para facilitar lectura y evitar ampliación automática asociada a texto pequeño en ciertos navegadores.
- Campos numéricos sugieren teclado decimal o numérico según medición; teléfono usa tipo tel y fecha usa el selector nativo. La entrada con coma decimal y diferencias regionales requieren pruebas reales, sin prometer normalización ya implementada.
- No hay acciones que dependan exclusivamente de hover. El foco visible y los mensajes de estado de T10 se conservan.
- Los mensajes flotantes se sitúan sobre la navegación inferior, no detrás de ella. Las acciones de guardar no son una barra fija que tape el teclado o el final del formulario.

La reducción de movimiento se respeta mediante una regla de preferencia; no se añaden animaciones esenciales para entender el flujo. Los estilos permiten que los títulos, estados y nombres largos se envuelvan en varias líneas.

## Conectividad y límites del prototipo

El encabezado móvil informa que el sistema web final requiere conexión. El interruptor de simulación offline del prototipo de escritorio se oculta en móvil para no sugerir que la web tiene capacidad offline.

La maqueta puede abrirse como archivo sin internet porque no contiene servicios reales ni dependencias remotas; eso no acredita guardado web offline. Las consultas de ejemplo se agregan a arrays de JavaScript, no a SQLite, MariaDB o almacenamiento del navegador. El aviso de demostración se mantiene visible.

El diseño requiere que un fallo real de red informe ausencia de confirmación y conserve la captura mientras sea posible; la implementación de esa política corresponde a API/interfaz, no se declara hecha mediante un mensaje estático. La sesión y sus permisos se diseñan en T12, y no hay cuentas reales operativas en este prototipo.

## Referencias de ancho y compatibilidad

| Ancho de referencia | Intención de diseño | Estado de verificación |
| --- | --- | --- |
| 360 px | Teléfono estrecho, formularios en una columna | Reglas CSS preparadas; prueba visual pendiente |
| 390 px | Vista de referencia del marco mobile.html | Marco preparado; no emula un dispositivo |
| 430 px | Teléfono ancho y nombres largos | Reglas CSS preparadas; prueba visual pendiente |
| Hasta 800 px | Activar presentación táctil y listados en tarjetas | Punto de adaptación de diseño, no clasificación de sistema operativo |
| Más de 800 px | Conservar presentación de escritorio de T10 | Comprobar regresión visual al revisar ambos modos |

Chrome en Android es el objetivo inicial; Safari en iOS debe comprobarse. No se afirma compatibilidad por el nombre del dispositivo. En orientación horizontal, el punto de adaptación depende del ancho disponible y puede mostrar la composición de escritorio; se debe revisar si requiere ajuste posterior.

## Guion de revisión pendiente

| Caso | Acción | Resultado a comprobar |
| --- | --- | --- |
| MOV-01 | Abrir directorio a 360/390/430 px | Sin desplazamiento horizontal de toda la página; tarjetas con campos legibles |
| MOV-02 | Buscar nombre y cambiar especie | Lista actualizada; estado vacío entendible; etiquetas de tarjeta conservadas |
| MOV-03 | Abrir expediente desde una tarjeta | Identidad y propietario visibles junto al historial; destino inferior seleccionado |
| MOV-04 | Consultar ambas pestañas del carnet | No se pierde el paciente; se distingue ausencia de próxima fecha |
| MOV-05 | Capturar consulta con teclado abierto | Etiquetas y unidades legibles; campos y acciones alcanzables sin superposición |
| MOV-06 | Guardar o cancelar una consulta de ejemplo | Resultado en memoria o confirmación de descarte según el flujo; sin promesa de persistencia |
| MOV-07 | Crear propietario y paciente con nombres largos | Sin ruptura de tarjetas, diálogos o navegación |
| MOV-08 | Aumentar texto, rotar y usar lector de pantalla | Orden comprensible y controles accesibles; registrar defectos, no asumir conformidad |
| MOV-09 | Abrir por enlace HTTPS en Android y iOS | Revisar selectores, teclado regional, foco, dialog y zonas seguras en dispositivos reales |

Estos son guiones futuros, no pruebas ejecutadas ni mediciones de M15. Los casos remotos necesitan un despliegue de prueba. No se agrega impresión, exportación, cámara o carga de archivos por el hecho de usar celular.

## Verificación realizada y cierre

Comprobación estática de sintaxis JS, recursos referenciados, enlaces locales e IDs del HTML. La sesión del navegador utilizada en T10 no permitió la revisión visual; T11 no acredita que ese bloqueo esté resuelto ni que se haya ejecutado el guion móvil.

- [x] Adaptar directorios, expediente, carnet y captura al ancho móvil.
- [x] Mantener identidad del paciente y etiquetas de datos sin ocultar paneles esenciales.
- [x] Preparar navegación inferior y controles de captura táctil.
- [x] Separar la web conectada de la capacidad offline del escritorio.
- [x] Preparar una vista previa móvil y guiones de revisión.
- [ ] Ejecutar revisión visual y táctil en navegador y dispositivos.
- [ ] Recibir observaciones de diseño para revisión conjunta T14.

Resultado: diseño móvil T11 preparado para revisión; sin aplicación conectada ni pruebas de compatibilidad acreditadas.

Siguiente tarea: T12 — Definir los niveles de acceso y protección de la información; responsable Priscila Cortés Ramírez; ventana documental del 15 al 18 de septiembre de 2026.
