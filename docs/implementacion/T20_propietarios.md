# T20 - Desarrollar propietarios

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Priscila Cortés Ramírez (PC) |
| Fechas previstas | 30 de septiembre al 6 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Código integrado; prueba real y revisión visual pendientes |

## Entrega

Registro, consulta, búsqueda, edición, baja lógica y reactivación de propietarios en MariaDB. Los roles administrador y veterinario pueden utilizarlos, con sesión vigente; las escrituras exigen origen autorizado y CSRF. No hay borrado físico. La API utiliza el usuario de la sesión como autor, sin aceptar un autor enviado por la vista.

Campos: nombre obligatorio (hasta 200 caracteres); teléfono opcional (50), domicilio (500) y localidad (200). El teléfono se conserva como texto, incluidos prefijos y ceros. Se admiten nombres iguales sin fusionar personas. La búsqueda central usa nombre, teléfono o localidad; los caracteres % y _ se buscan literalmente, no se interpretan como patrones del usuario. El directorio muestra 50 registros por página con filtros de estado.

La ruta `/api/v1/owners` permite GET, POST y PATCH. Las bajas son una actualización de estado. Cada actualización exige la versión que leyó el usuario: una edición concurrente devuelve OWNER_CONFLICT sin sobrescribirla. Se almacena una versión completa por cambio con su autor. La UI conserva la captura tras un error mientras permanezca abierta; no mezcla automáticamente versiones en conflicto.

Cada envío lleva operationId, un UUID. La API almacena huella de carga, autor y resultado en la misma transacción que el registro y su versión. Reintentar exactamente una operación confirmada devuelve el resultado anterior. Reutilizar el identificador con otra carga o usuario se rechaza. Un bloqueo por operación serializa reintentos concurrentes. El formulario conserva el identificador de un envío no confirmado para poder reintentarlo sin duplicar dentro de la misma vista; no es todavía una cola durable de sincronización.

## Ejecutar en tu terminal

Detener el servidor anterior con Ctrl+C y ejecutar desde la raíz de VetCare:

```powershell
npm run db:check
npm run db:migrate
npm run test:owners:database
npm run dev
```

`db:migrate` conserva 001_auth y aplica 002_owners: tabla de propietarios, versiones y operaciones. No elimina cuentas ni datos. La prueba utiliza tablas temporales en su propia conexión y no modifica propietarios reales. Las FK no se reproducen en las tablas temporales por la restricción de MariaDB sobre ellas; la migración y futura integración con pacientes requieren su comprobación separada.

### Recorrido práctico

1. Abrir http://127.0.0.1:5173, recargar con Ctrl+F5 e iniciar sesión.
2. Retirar la muestra de demostración si está activa. Entrar en Propietarios. Debe indicar DIRECTORIO CENTRAL.
3. Crear un propietario ficticio, por ejemplo Propietario prueba T20, con teléfono y localidad. El aviso de éxito solo aparece tras la respuesta del servidor.
4. Recargar la página y comprobar que sigue registrado. Cerrar sesión, volver a ingresar y repetir la consulta.
5. Buscarlo, editar teléfono/domicilio y guardar. Darlo de baja: debe desaparecer del filtro Activos; en Inactivos puede reactivarse.
6. Abrir el mismo propietario para editar en dos pestañas. Guardar en una y luego en la otra: la segunda debe mostrar conflicto y conservar su captura. Copiar lo necesario, recargar el directorio y abrir la versión reciente antes de volver a editar.
7. Repetir como veterinario para comprobar el permiso clínico. En Electron se usa `npm run dev:desktop`; se comunica con la misma API mediante el proceso principal, sin credenciales MariaDB en las vistas.

No cargar datos de personas reales para estas pruebas. La muestra T17 permanece separada: con Demostración activa, Propietarios sigue mostrando sus datos en memoria y sus formularios de revisión.

## Dependencias y límites

- Entrega conectada para web y Electron. SQLite T16 continúa siendo almacenamiento técnico; todavía no existe réplica de propietarios, guardado offline o cola durable. Estos requieren autorización local, aislamiento por identidad y sincronización de las tareas correspondientes.
- La relación con pacientes se implementa en T21. El bloqueo de baja consulta vc_patients si existe; T21 debe conservar ese nombre y las columnas owner_id/active, añadir la FK y bloquear el propietario al vincular o reactivar pacientes para evitar carreras. El caso con pacientes reales todavía no está acreditado.
- Los selectores de pacientes y sus expedientes continúan siendo pantallas en preparación. Este módulo no crea pacientes ni convierte los ejemplos en registros reales.
- Las versiones se conservan en central, pero su visualización y resolución de conflictos completa se desarrollarán en las tareas de historial/sincronización. T20 detecta y rechaza una versión obsoleta.
- Si hay un resultado de red incierto, reintentar los mismos datos sin recargar utiliza el mismo operationId. Tras cerrar la vista, revisar el directorio antes de volver a crear; la recuperación durable de una operación pendiente no está implementada.
- Los cinco segundos por petición reportados en T19 siguen pendientes de medición y optimización; este módulo no acredita resolver esa latencia.

## Verificación

Pruebas sin conexión: campos, límites, identificadores y estructura de la vista, además de regresión de acceso, almacenamiento y pantallas. La integración HTTP verifica recursos y rechazos de lectura anónima, escritura desde origen externo y DELETE.

`test:owners:database` comprueba en MariaDB operaciones idempotentes, versiones, rechazo de edición obsoleta, búsquedas, nombres iguales, baja/reactivación y permisos usando tablas temporales. En esta sesión no se pudo completar la conexión central; la ejecución de esa prueba y del recorrido visual sigue pendiente en la terminal del usuario. No se declara migración aplicada ni aprobación clínica.
