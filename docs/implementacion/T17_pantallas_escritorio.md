# T17 - Crear pantallas de escritorio

| Dato | Valor |
| --- | --- |
| Responsable documental | Diego Alonso Coronel Vargas (DA) |
| Inicio previsto | 24 de septiembre de 2026 |
| Fin previsto | 2 de octubre de 2026 |
| Preparación de esta entrega | 18 de noviembre de 2026 |
| Estado | Pantallas integradas; verificadas en navegador; revisión visual en Electron pendiente |

Las fechas previstas y la asignación corresponden al cronograma. No se cambia el historial de Git ni se acredita una aprobación formal del equipo.

## Entrega ejecutable

La aplicación servida desde `web/`, que también carga Electron, incorpora pacientes, propietarios, expediente, seguimiento, carnet de vacunas y desparasitaciones y formulario de consulta. Se reutiliza el diseño de T10 y su adaptación de T11: verde oscuro, oliva, marfil y acentos dorados, sin dependencias adicionales.

La navegación mantiene seleccionado al paciente y evita abrir expedientes sin selección. El directorio busca por nombre, raza o propietario, sin distinguir acentos, y filtra por especie. Los formularios revisan la captura, muestran campos obligatorios de la propuesta y advierten que no existe guardado clínico todavía. La próxima aplicación es opcional y no se calcula automáticamente. Las decisiones D-T5-01/02/03 siguen pendientes; esta interfaz no las convierte en requisitos aprobados.

La consulta y los diálogos advierten antes de descartar campos modificados. Cancelar conserva la captura abierta. La protección frente a cierre o recarga depende también de los avisos permitidos por el navegador; no hay recuperación automática de borradores.

El inicio está vacío. **Cargar datos de demostración** incorpora una muestra ficticia únicamente en memoria, identificada en el encabezado y las fichas. **Retirar muestra** y la recarga la eliminan de la vista. No se insertan pacientes de ejemplo en SQLite ni se envían al servidor. Los formularios no simulan confirmaciones de guardado.

**Estado del entorno**, en la barra superior, conserva la comprobación real de PHP y, en Electron, el panel de persistencia técnica T16. No se modifica su esquema ni la ubicación del archivo SQLite. La captura clínica, autenticación, MariaDB y sincronización corresponden a sus tareas posteriores.

## Comprobar la entrega

Cerrar procesos anteriores y ejecutar desde la raíz:

```powershell
npm run dev:desktop
```

1. Comprobar el directorio vacío y cargar la demostración.
2. Buscar `ana martinez`: deben aparecer Luna y Nala. Probar los filtros de especie.
3. Abrir Luna y alternar historial, seguimiento y carnet. El evento de desparasitación muestra que no hay próxima fecha programada.
4. Abrir una consulta, completar una fecha y un motivo ficticio y pulsar **Revisar captura**. Se muestra la revisión con aviso explícito de que no se guardó información.
5. Intentar cambiar de sección; cancelar el aviso debe conservar la captura. Aceptarlo debe permitir salir.
6. Revisar los formularios de propietario, paciente y evento sanitario. El formulario de paciente necesita propietarios de la muestra para poder revisarse.
7. Abrir **Estado del entorno**, comprobar PHP y verificar que el texto técnico de T16 sigue disponible en Electron. No introducir datos clínicos reales.
8. Retirar la muestra y comprobar que no queda paciente seleccionado.

La alternativa para revisar en navegador es `npm run dev`, en http://127.0.0.1:5173. Ambos son modos de desarrollo; no constituyen el alojamiento remoto final.

## Verificación y límites

- `npm test`: 13 pruebas correctas de API, SQLite, aislamiento de la muestra, búsqueda, selección, fechas opcionales y escape de HTML.
- `npm run test:desktop-storage`: cinco pruebas correctas con SQLite dentro del ejecutable de Electron; esto no acredita la apertura de su ventana.
- `npm run check`: sintaxis de JavaScript y PHP correcta.
- `npm run build`: empaquetado de los ocho archivos públicos, sin publicar documentos, credenciales o código del servidor.
- `npm run test:integration`: correcta la entrega HTTP de los nuevos recursos, la API y el aislamiento de archivos privados.
- Comprobación interactiva en navegador: directorio vacío, carga de muestra, búsqueda por propietario, expediente, revisión de consulta, aviso de descarte y conservación al cancelarlo, carnet, formulario sanitario y respuesta real de PHP.

El arranque gráfico de Electron desde esta sesión terminó con código 1 sin mensaje de diagnóstico. No se declara comprobación visual de T17 en Electron; queda el recorrido anterior para ejecutarlo en la terminal del usuario, donde ya había confirmado el arranque de T15. No se ha validado exhaustivamente accesibilidad, navegadores o tamaños de pantalla, ni publicado la aplicación.

Archivos principales: `web/main.js` coordina navegación y formularios; `web/view-state.js` aísla la muestra; `web/views.js` renderiza las pantallas; `web/diagnostics.js` conserva las operaciones de T16. No se añade acceso genérico a SQL o archivos a través de IPC.
