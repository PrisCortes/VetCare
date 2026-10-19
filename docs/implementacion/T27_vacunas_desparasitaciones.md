# T27 - Vacunas y desparasitaciones

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Priscila Cortés Ramírez (PC) |
| Fechas previstas | 12 al 19 de octubre de 2026 |
| Implementación | 20 de noviembre de 2026 |
| Estado | Persistencia central, correcciones y pruebas integradas; integración con expediente/carnet y sincronización offline pendientes |

## Resultado

El formulario de atención ahora guarda vacunaciones y desparasitaciones como eventos independientes de una consulta. Cada evento pertenece a un paciente, conserva la fecha de aplicación, producto, próxima fecha opcional y los datos propios de su tipo:

- Vacunación: aplicación como texto libre opcional.
- Desparasitación: peso opcional, almacenado como gramos enteros.

La próxima fecha no se calcula automáticamente. Si queda vacía se conserva como `null` y la pantalla muestra «Sin fecha programada».

Desde la pestaña Vacunación o Desparasitación se puede guardar, consultar los eventos de ese tipo y abrir uno para corregirlo. Una corrección mantiene el mismo evento, incrementa la versión y conserva la revisión anterior, el autor original y la fecha de creación.

## Persistencia e integridad

La migración `005_sanitary_events` crea tablas separadas para vacunaciones y desparasitaciones, sus revisiones y las operaciones idempotentes. La API `GET`, `POST` y `PATCH /api/v1/sanitary-events` exige sesión, permisos clínicos, origen permitido y CSRF en escrituras.

Cada escritura incluye `operationId`, `patientId` y `patientVersion`. Un reintento con la misma carga devuelve el resultado original; reutilizar la operación con otra carga se rechaza. Las correcciones validan versión, paciente y contexto actual. Un paciente inactivo no admite eventos nuevos, pero permite corregir uno ya existente.

El acceso offline para estos eventos no se habilita aún: T25 conserva propietarios, pacientes y consultas locales, y T32–T35 definirán la cola, el envío y los conflictos de eventos sanitarios. El formulario lo comunica y no finge guardado local de vacunas o desparasitaciones.

## Cómo comprobar esta fase

Con la configuración TLS de MariaDB disponible, detener cualquier servidor anterior y ejecutar desde la raíz:

```powershell
npm run db:migrate
npm run test:sanitary:database
npm test
npm run check
npm run dev
```

La migración debe informar `005_sanitary_events`. La prueba de base de datos usa tablas temporales y no modifica pacientes ni expedientes reales.

En el navegador:

1. Inicia sesión y selecciona un paciente activo en **Pacientes** → **Preparar atención**.
2. Abre **Vacunación**, indica fecha realizada, vacuna y, opcionalmente, Aplicación y Próxima fecha. Pulsa **Guardar vacunación**.
3. Pulsa **Consultar registros**, abre el evento y cambia la próxima fecha. **Guardar corrección** debe aumentar la versión sin crear otro evento.
4. Abre **Desparasitación**, registra producto, peso opcional —por ejemplo `0,001` kg— y una próxima fecha opcional. Debe mostrarse como `0.001 kg` al recuperarlo.
5. Prueba una fecha de aplicación futura y una próxima fecha anterior a la aplicación: ambas deben rechazarse sin borrar la captura. Deja la próxima fecha vacía y verifica «Sin fecha programada».
6. En Electron sin conexión, verifica que la pantalla informa que el guardado sanitario offline se habilitará con la sincronización; no debe afirmar que se guardó en MariaDB ni en la cola local.

## Evidencia

- `npm test`: 52 pruebas aprobadas.
- `npm run check`: sintaxis PHP y JavaScript correcta.
- `npm run test:sanitary:database`: prueba contra MariaDB TLS terminada con tablas temporales.
- `npm run build`: web preparada en `dist/`; no desplegada.

## Límites y siguiente fase

T27 no agrega recordatorios, correos, cálculo de dosis, calendarios automáticos ni recetas. Tampoco incorpora los eventos a la línea del expediente o a la pantalla Carnet sanitario conectada: esa integración corresponde a T29. La sincronización de estos eventos se incorpora a la secuencia T32, T34 y T35.

El siguiente desarrollo funcional previsto es T28: consulta desde móviles. Por prioridad de integridad acordada, puede adelantarse T32 antes de T28 para enviar la cola offline existente.

## Responsable, fechas y commit

- Responsable: Priscila Cortés Ramírez (PC).
- Ventana del cronograma: 12 al 19 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T27): guardar vacunas y desparasitaciones`.
