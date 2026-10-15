# T24 - Desarrollar historial

| Dato | Valor |
| --- | --- |
| Responsable | Priscila Cortés Ramírez (PC) |
| Fechas previstas | 9 al 15 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Historial integrado; pruebas centrales y revisión visual pendientes |

## Resultado

Desde Pacientes, Ver expediente abre el historial central de la ficha seleccionada. Muestra identificación, propietario y estado activo/inactivo; consultas con motivo, tratamiento, observaciones y mediciones; autores y edad registrada al capturar. No sustituye la edad histórica por la ficha actual.

El resumen indica total de consultas y último peso registrado en consulta, con fecha e identificador de la consulta de origen. No crea un peso actual mutable ni presupone que existen mediciones cuando son null. Vacunas, desparasitaciones y seguimientos todavía no se agregan a la línea de antecedentes; se informan como pendientes de integración.

Se puede buscar en motivo, tratamiento y observaciones y filtrar Desde/Hasta. Los límites del filtro son fechas de calendario, admiten intervalos futuros que pueden no tener coincidencias y rechazan un Desde posterior a Hasta. Esto no cambia las reglas de captura de atención realizada de T22/T23. Buscar/actualizar vuelve a la primera página y consulta el servidor.

## Orden y versiones

Las consultas se presentan por fecha descendente e ID descendente como desempate, 20 por página. El cursor contiene fecha e ID de la última fila y se valida antes de SQL. No utiliza un offset que se desplace al insertar registros más recientes. En un conjunto sin modificaciones, fechas iguales no provocan saltos o repeticiones. Si se corrigen fechas o contenidos mientras se navega, actualizar reinicia el recorrido del estado actual; no se ofrece una instantánea congelada entre peticiones.

Ver versiones recupera exclusivamente las revisiones de la consulta y paciente indicados, de mayor a menor versión, 20 por lote. Incluye autor y momento de revisión, con fecha/hora presentada en America/Mexico_City. El servidor toma la versión actual al abrir la consulta y no mezcla revisiones posteriores en ese lote si aparece otra corrección durante la lectura. Las revisiones son de solo lectura: no se restaura ni elimina contenido desde este panel.

Corregir consulta abre el formulario de T23 con la versión seleccionada del registro actual. No crea otra visita ni cambia el paciente. T23 conserva la historia y vuelve a verificar la versión al guardar. Nueva consulta solo se habilita con paciente activo; la consulta de antecedentes y corrección de registros previos sigue disponible con paciente inactivo.

## Acceso y contrato

GET `/api/v1/history` requiere patientId; acepta q, from, to y cursor. Devuelve patient, consultations, nextCursor, totalConsultations y latestConsultationWeight. GET `/api/v1/consultation-versions` exige patientId y consultationId; acepta before para continuar versiones. Una consulta que pertenece a otro paciente responde CONSULTATION_NOT_FOUND, sin devolver versiones ajenas.

Ambas rutas requieren sesión vigente y clinical.read para administrador o veterinario. No admiten escritura. Los filtros se enlazan mediante parámetros SQL; % y _ de búsqueda se tratan literalmente. La vista escapa textos clínicos y nombres al renderizar. Las acciones de Electron pasan por el proceso principal con lista cerrada de rutas; no se exponen SQL ni credenciales.

No se guardan registros del historial en localStorage, ni se utiliza la caché temporal de directorios para estos endpoints. Las respuestas de una ficha descartada no deben pintar sobre otra: se comprueban el panel vigente, secuencia de petición y consulta seleccionada. Al cerrar/cambiar sesión se retira el contexto. Al recargar se debe seleccionar nuevamente el paciente; no se persiste su selección en esta entrega.

## Comprobación práctica

Se requieren las migraciones hasta 004_consultations ya aplicadas; T24 no añade tablas. Detener el proceso anterior y ejecutar:

```powershell
npm run test:history:database
npm run dev
```

1. Abrir http://127.0.0.1:5173 y recargar con Ctrl+F5. Iniciar sesión y retirar la muestra si estuviera activa.
2. En Pacientes, pulsar Ver expediente. Comprobar nombre, especie, propietario y UUID antes de interpretar el historial.
3. Si no hay consultas, pulsar Nueva consulta, guardar una visita ficticia con tratamiento y peso; volver al expediente y actualizar.
4. Buscar una palabra del tratamiento y aplicar un intervalo. Probar un filtro sin coincidencias y limpiar para recuperar todos los registros. La cantidad total y el último peso corresponden al paciente completo, no solo al filtro.
5. Corregir el tratamiento desde Corregir consulta y guardar. Volver al expediente, actualizar y abrir Ver versiones: deben verse tratamiento anterior y actual con su revisión y autor.
6. Probar pacientes con nombres iguales: solo deben aparecer las consultas del ID seleccionado. Una ficha sin consultas no debe heredar los registros de la anterior.
7. Dar de baja al paciente, volver al directorio con filtro Inactivos y abrir Ver expediente: debe conservar las consultas y permitir correcciones, sin habilitar una visita nueva.
8. Con más de 20 consultas, avanzar y retroceder; registros de la misma fecha deben conservar el desempate por ID. Las pruebas centrales generan estos casos en tablas temporales.

## Evidencia y límites

Pruebas locales: filtros, calendarios, cursores, escape de textos y edad histórica. Integración HTTP: recursos, bloqueo anónimo y métodos no admitidos. La prueba real `test:history:database` crea tablas temporales en su conexión, dos pacientes homónimos y 21 consultas para verificar paginación, separación, búsquedas, peso, versiones y lectura con paciente inactivo. No modifica registros reales; puede tardar por la cantidad de operaciones. Las FK se omiten en temporales por restricciones del motor y la concurrencia entre sesiones requiere verificación adicional.

La conexión al proveedor sigue sin poder completarse desde esta sesión: el resultado central y el recorrido visual quedan pendientes en la terminal del usuario. No se acredita funcionamiento offline, snapshots, integración de carnet o restauración de versiones.
