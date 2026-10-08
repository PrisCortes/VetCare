# T22 - Preparar formularios de atención

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Diego Alonso Coronel Vargas (DA) |
| Fechas previstas | 2 al 8 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Formularios y validación integrados; prueba central y recorrido visual pendientes |

## Entrega ejecutable

Desde el directorio central de pacientes, Preparar atención abre un formulario con la identificación del paciente, especie, propietario, UUID y versión. Se puede elegir consulta, vacunación o desparasitación. El paciente no se toma de un texto editable. Un paciente inactivo no habilita el botón y la API también lo rechaza.

| Formulario | Mínimos de la propuesta | Opcionales |
| --- | --- | --- |
| Consulta | Paciente, fecha y diagnóstico/motivo | Peso, temperatura, FC, FR, tratamiento y observaciones |
| Vacunación | Paciente, fecha y vacuna | Aplicación como texto libre y próxima fecha |
| Desparasitación | Paciente, fecha y producto | Peso y próxima fecha |
| Seguimiento | Requiere una consulta registrada | Su habilitación queda pendiente de la persistencia de consultas |

Los mínimos y unidades siguen las propuestas D-T5-01/02/03; esta entrega no acredita aprobación clínica. El seguimiento tiene estructura de campos preparada, pero no se habilita con identificadores de consulta inventados: frontend y backend lo rechazan hasta contar con consultas reales.

## Validación y precisión

Se valida antes de contactar con la API y se repiten las reglas en PHP. Los errores aparecen junto al campo, con aria-invalid y un resumen cuyos botones enfocan el control correspondiente. Los textos se conservan en pantalla ante errores. Cambiar de formulario o navegar con captura modificada requiere confirmar el descarte. Editar durante una revisión invalida su resultado: no se muestra como validada una captura distinta de la enviada.

- Fechas de atención reales, no futuras y no anteriores al nacimiento conocido. No se impone nacimiento ficticio para edades estimadas. La próxima aplicación puede ser futura, pero no anterior a la aplicación.
- Peso opcional positivo en kg, hasta tres decimales, normalizado como gramos enteros. Temperatura opcional con hasta dos decimales, normalizada como centésimas de °C. FC y FR opcionales como enteros positivos por minuto.
- Se admite punto o coma decimal, sin separadores de miles. No se aceptan exponentes, valores no finitos ni exceso de decimales; no hay redondeo silencioso ni cálculo de dosis.
- Los valores ausentes permanecen null. No se rellenan fecha, diagnóstico, tratamiento o próximas aplicaciones automáticamente.
- Los límites numéricos son técnicos para representación de enteros, no umbrales clínicos por especie. Los textos de consulta admiten 10000 caracteres por campo; producto y Aplicación de vacunación, 200. El transporte de validación permite hasta 512 KiB para soportar textos Unicode multilínea sin truncarlos.

## Contrato de servidor

POST `/api/v1/attention/validate` requiere sesión, permiso clinical.write, origen autorizado y CSRF. Relee el paciente en MariaDB y comprueba estado activo y patientVersion. Si la ficha cambió, devuelve PATIENT_CONTEXT_CHANGED y exige revisar el contexto antes de continuar.

La respuesta válida contiene `validated: true` y `saved: false`, el paciente y los datos normalizados. Las claves weight y temperature del contrato normalizado contienen gramos y centésimas; la vista previa vuelve a mostrarlas en kg y °C. Si falla un campo, responde 422 con un mapa fields, sin confirmar guardado.

No se crean tablas ni consultas ni eventos sanitarios en T22. El indicador «Captura validada · No guardada» permanece visible en la vista previa. La persistencia de consultas y tratamientos corresponde a T23. El sistema no recupera la captura después de recargar/cerrar la página o cambiar identidad; no se escribe texto clínico en localStorage o SQLite.

En Electron se utiliza el puente de acciones permitido del proceso principal; cookie y CSRF no se exponen a las vistas. Las reglas de la API son las mismas. El acceso clínico offline sigue pendiente de T25 y sus dependencias.

## Comprobación práctica

Con las migraciones de T21 aplicadas y un propietario/paciente ficticios registrados, detener el servidor anterior y ejecutar:

```powershell
npm run test:attention:database
npm run dev
```

1. Abrir http://127.0.0.1:5173 y recargar con Ctrl+F5. Iniciar sesión y retirar la demostración si estuviera activa.
2. En Pacientes, pulsar Preparar atención en un paciente activo. Verificar su identificación y propietario antes de capturar.
3. En Consulta, pulsar Revisar captura sin completar datos: deben señalarse fecha y diagnóstico/motivo, conservando lo escrito.
4. Capturar una fecha válida, motivo, peso `0,001`, temperatura `38,25`, FC `80` y FR `20`. Revisar: la vista previa debe indicar 0.001 kg y 38.25 °C y «No guardada».
5. Probar peso cero, FC decimal, fecha futura y una fecha anterior al nacimiento conocido. Cada caso debe rechazarse sin perder la captura.
6. Cambiar a Vacunación confirmando el descarte. Capturar vacuna y fecha dejando la próxima fecha vacía: debe indicar Sin fecha programada. La próxima fecha anterior a la aplicación debe rechazarse.
7. Probar Desparasitación con peso opcional y revisar el aviso de ausencia de guardado.
8. Con la captura abierta, editar la ficha del paciente desde otra pestaña y volver a revisar: el servidor debe rechazar la versión anterior. Lo mismo si se da de baja el paciente. No se guarda atención con contexto desactualizado.
9. Intentar salir o cambiar de formulario con cambios: cancelar debe conservarlos. Si se recarga y se pierde el contexto, debe solicitar volver a seleccionar al paciente.

La prueba `test:attention:database` utiliza tablas temporales y verifica contexto, permisos, estado, nacimiento y ausencia de escrituras de dominio durante la validación. No modifica pacientes reales. Requiere conexión TLS central y permisos de tablas temporales. Si fallara db:check, resolver esa conexión antes de interpretar el fallo como un defecto de formulario.

## Evidencia y pendientes

Pruebas locales: precisión de números, coherencia de errores entre PHP y JavaScript, Unicode, límites, fechas, campos ausentes, próxima fecha y escape de datos en las vistas. La integración HTTP verifica recursos públicos y rechazo de acceso anónimo, origen externo y métodos no previstos.

La comprobación real con MariaDB y la revisión visual permanecen pendientes donde la conexión no está disponible. No se acredita guardado clínico ni historia persistente con estas pruebas. La interfaz T17 de demostración conserva sus formularios separados, sin convertir muestras en datos centrales.
