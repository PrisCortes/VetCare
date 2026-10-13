# T23 - Consultas y tratamientos

| Dato | Valor |
| --- | --- |
| Responsable | Priscila Cortés Ramírez (PC) |
| Ventana del cronograma | 6 al 13 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Guardado y correcciones integrados; prueba central y recorrido visual pendientes |

## Entrega

El formulario de consulta ahora distingue Revisar captura (validación sin guardar) de Guardar consulta (persistencia en MariaDB). Un mensaje de éxito requiere respuesta del backend después del commit. La lista Consultas registradas recupera 20 registros por página, con apertura del contenido y corrección. Nueva consulta inicia otra visita; editar un registro existente no crea una visita ficticia.

El guardado de vacunación y desparasitación continúa pendiente de T27. Seguimiento sigue pendiente de su integración con una consulta existente; no se habilita automáticamente solo porque ya exista la tabla. T24 desarrollará la presentación del historial completo. Esta entrega proporciona la recuperación necesaria para comprobar el guardado y corregir consultas.

## Fechas y campos

Fecha de atención realizada representa lo que ya ocurrió: se admite hoy o una fecha anterior válida, no una fecha futura. Próxima fecha en los formularios sanitarios representa una aplicación programada: puede ser futura y no tiene máximo fijado en hoy. La interfaz incluye esta explicación. Una cita futura es un concepto distinto que no se persiste como atención realizada.

Se reutilizan las validaciones T22: paciente, fecha y diagnóstico/motivo obligatorios según la propuesta; mediciones, tratamiento y observaciones opcionales. Peso y temperatura se guardan como gramos y centésimas enteras. Los valores ausentes son null. No se inventan diagnósticos ni tratamientos. Las decisiones de captura de T5 siguen siendo propuestas pendientes de aprobación clínica.

## Integridad y autoría

Migración 004_consultations: tabla de consultas con FK a paciente y autores, versiones completas e identificadores de operaciones. No existe borrado físico en API.

- Una consulta nueva requiere paciente activo y su versión actual. La comprobación y escritura ocurren con bloqueo del paciente dentro de la transacción.
- Una corrección conserva paciente, autor original, fecha de creación y snapshot de edad de la captura original; registra autor actual y nueva versión. No puede trasladarse a otro paciente.
- La edad capturada conserva nacimiento conocido o estimación con su referencia y versión de paciente. Modificar después la edad del paciente no reescribe consultas anteriores. Corregir una consulta mantiene ese contexto histórico y usa el nacimiento capturado originalmente para validar su fecha.
- Se puede corregir una consulta histórica de un paciente inactivo, sin permitir nuevas consultas. Desde el directorio se accede mediante Consultas, también con el filtro Inactivos.
- Una versión de consulta obsoleta produce CONSULTATION_CONFLICT sin sobrescribir el cambio de otra sesión. La ficha actual del paciente también se valida mediante patientVersion.
- operationId liga carga, actor y resultado. Reintentar el mismo envío devuelve el resultado durable; reutilizar la identidad con otros datos se rechaza. El resultado se confirma en la misma transacción que consulta, versión y auditoría, bajo bloqueo por operación.

El navegador conserva la identidad de un envío sin confirmar mientras el formulario siga abierto y exige reintentar la misma carga. No es todavía una cola durable: después de cerrar/recargar, revisar los registros antes de volver a crear. Tras un éxito se bloquea el guardado repetido sin cambios; editar la captura corrige la consulta existente y Nueva consulta genera otra visita.

## Contrato

GET `/api/v1/consultations?patientId=UUID&page=1` exige permiso clinical.read. POST crea y PATCH corrige con permiso clinical.write, origen permitido y CSRF. Los dos envíos usan los textos y mediciones del formulario; el backend normaliza nuevamente. PATCH exige id y version. La respuesta exitosa contiene `saved: true` y consultation. La API no confía en autores enviados por la vista.

El puente Electron permite únicamente las acciones consultations/createConsultation/updateConsultation y conserva tokens fuera de las vistas. El acceso sigue requiriendo conexión central; SQLite clínico y sincronización se trabajan en tareas posteriores.

## Ejecutar y comprobar

Detener el servidor anterior y ejecutar desde la raíz de VetCare:

```powershell
npm run db:check
npm run db:migrate
npm run test:consultations:database
npm run dev
```

1. Abrir http://127.0.0.1:5173, recargar con Ctrl+F5 e iniciar sesión.
2. Seleccionar un paciente ficticio activo y Preparar atención. Capturar fecha pasada/hoy, motivo y tratamiento. Revisar captura debe indicar No guardada.
3. Pulsar Guardar consulta y esperar confirmación. Debe aparecer Consulta guardada en MariaDB y un registro en la lista. Pulsar Nueva consulta para otra visita.
4. Recargar, seleccionar el mismo paciente, entrar mediante Consultas y pulsar Consultar registros. Abrir la consulta: el tratamiento y las mediciones deben conservarse.
5. Modificar tratamiento, guardar corrección y volver a consultar: mismo ID y versión incrementada. El registro anterior permanece en vc_consultation_versions.
6. Abrir una consulta en dos pestañas. Guardar en una y después en la otra: la segunda debe rechazar la versión antigua. Conservar o copiar lo necesario de la captura, actualizar registros y abrir la versión reciente antes de corregir.
7. Dar de baja al paciente desde su directorio. Abrir Consultas en el filtro Inactivos y comprobar que se permite corregir un registro anterior, pero no guardar una visita nueva.
8. Próxima fecha de vacunación/desparasitación debe aceptar una fecha futura en Revisar captura; la fecha de la aplicación realizada no. Estos eventos todavía no se guardan.

## Verificación y límites

Pruebas locales: identidad de operación, vista escapada, unidades, reglas de fecha diferenciadas y regresión de acceso/formularios. Integración HTTP: rechazo anónimo y de DELETE. La prueba central utiliza tablas temporales y comprueba guardado, tratamiento, reintentos, versiones, conflicto, edad histórica, permisos y paciente inactivo. No altera registros reales. Las FK se omiten en tablas temporales por limitación de MariaDB; requieren verificación sobre la migración física. Las carreras entre conexiones requieren pruebas adicionales: la prueba temporal ejecuta las operaciones de forma serial.

La prueba con MariaDB no se ha completado desde esta sesión; faltan ejecutar el recorrido con la conexión del usuario y revisar la interfaz visualmente. No se acredita persistencia offline, historial completo, snapshots ni aprobación clínica.
