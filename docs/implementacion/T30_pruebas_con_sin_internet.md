# T30 - Preparar pruebas con y sin internet

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Oscar Aarón Delgadillo Fernández (OD) |
| Fechas previstas | 12 al 16 de octubre de 2026 |
| Preparación | 21 de noviembre de 2026 |
| Estado | Escenarios, datos ficticios, entorno y registro de evidencia preparados; recorridos manuales pendientes |

## Propósito y límite

Este paquete prepara una prueba controlada de los recorridos conectado y sin conexión. No crea registros de prueba automáticamente, no desactiva la red del equipo, no sincroniza pendientes y no acredita resultados que aún no hayan sido observados.

La sincronización de registros pendientes se prueba como intercambio en T31 y se evalúa más adelante en T33. Los casos de T30 solamente dejan el entorno, los datos ficticios y los criterios para ejecutar esos recorridos de forma repetible.

## Entorno controlado

Usa una cuenta clínica destinada a pruebas y una sesión Windows de prueba. No uses nombres, teléfonos, direcciones ni expedientes reales.

| Elemento | Preparación requerida | Comprobación |
| --- | --- | --- |
| Código fuente | Rama y dependencias actuales, sin servidores previos ocupando 5173/8787 | `npm run doctor` |
| API central | `.env` local protegido, migraciones hasta `005_sanitary_events` y TLS disponible | `npm run db:check` y `npm run db:migrate` solo si falta una migración |
| Web conectada | Servidor local en `http://127.0.0.1:5173` | `npm run dev` |
| Electron offline | Claves de offline existentes y protección nativa de Windows disponible | `npm run offline:keys`, `npm run test:offline:windows`, `npm run dev:desktop` |
| Datos locales | Perfil Electron preparado con conexión antes de cortar la red | botón **Preparar sin conexión** |
| Evidencia | Hoja de resultados al final de este documento, sin contraseñas, llaves ni capturas clínicas | Un registro por caso |

`offline:keys` no debe copiar claves a mensajes, capturas ni Git. Si informa una pareja ya existente, se conserva: no se rota para una prueba. La prueba de Windows requiere una sesión de usuario con Electron; la suite portable no sustituye a DPAPI/safeStorage reales.

## Datos ficticios por ejecución

Elige un identificador único de corrida, por ejemplo `T30-20261121-A`, y úsalo literalmente en todos los datos. Así se distinguen de cualquier expediente y se pueden localizar para baja lógica al terminar.

| Entidad | Valor de ejemplo |
| --- | --- |
| Propietario | `T30-20261121-A Propietario ficticio` |
| Teléfono | `0000000000` |
| Localidad | `Prueba controlada` |
| Paciente | `T30-20261121-A Paciente ficticio` |
| Especie / raza | `Perro` / `Prueba` |
| Consulta | Motivo: `T30 revisión ficticia`; tratamiento: `Sin indicación real` |
| Vacunación | Producto: `T30 vacuna ficticia`; aplicación: `Prueba` |
| Desparasitación | Producto: `T30 desparasitante ficticio`; peso: `1.250` kg |

Registra los UUID que muestra la interfaz solo dentro de la evidencia privada del proyecto. Al concluir, da de baja lógicamente al paciente y propietario de prueba cuando la relación ya no tenga pacientes activos; no se usan borrados directos ni se modifican datos ajenos.

## Escenarios preparados

| ID | Modo | Acción controlada | Resultado esperado | Estado de ejecución |
| --- | --- | --- | --- | --- |
| T30-ON-01 | Con conexión | Iniciar sesión web, crear propietario, paciente y consulta ficticios | Cada guardado confirma MariaDB; expediente muestra la consulta | Pendiente |
| T30-ON-02 | Con conexión | Guardar vacuna y desparasitación; abrir expediente y carnet | Eventos del mismo paciente, versiones y próximas fechas visibles | Pendiente |
| T30-OFF-01 | Preparación | En Electron conectado, preparar la cuenta con una clave local distinta | Perfil local protegido y autorización de hasta 72 h; sin exponer la clave | Pendiente |
| T30-OFF-02 | Sin conexión | Cerrar sesión, cortar red, desbloquear el perfil y crear propietario, paciente y consulta ficticios | Aviso local, contador de tres pendientes y ninguna afirmación de guardado en MariaDB | Pendiente |
| T30-OFF-03 | Sin conexión | Cerrar y reabrir Electron sin red; desbloquear el mismo perfil | Registros y contador local se conservan; otra cuenta no los ve | Pendiente |
| T30-REC-01 | Reconexión, reservado | Restaurar red e iniciar sesión con la misma cuenta | Preparado para que T31 observe el intercambio; no registrar un éxito de sincronización dentro de T30 | No ejecutar en T30 |

Antes de cortar red, conserva la aplicación Electron abierta. El servidor de desarrollo local puede seguir activo: desconectar el adaptador Wi-Fi/Ethernet afecta el acceso central, no la URL local. No simules una desconexión únicamente con el interruptor del prototipo web.

## Orden recomendado de ejecución

```powershell
npm run doctor
npm test
npm run check
npm run db:check
npm run test:history:database
npm run test:offline
npm run test:offline:windows
npm run dev:desktop
```

`db:check` y `test:history:database` requieren la conexión TLS a MariaDB. La prueba de historial crea tablas temporales. `test:offline` usa un protector simulado y SQLite temporal; `test:offline:windows` verifica el cifrado nativo de Electron sin abrir el recorrido clínico.

Para revisar la web conectada en paralelo, abre otra terminal y ejecuta `npm run dev`. Si la prueba HTTP local se ejecuta en un entorno aislado que bloquee puertos, registra el bloqueo y repítela en la sesión Windows normal con `npm run test:integration`.

## Registro de evidencia

Completa una fila al ejecutar cada caso. «No ejecutado» es un estado válido; no se sustituye por una suposición basada en pruebas automatizadas.

| Caso | Fecha/hora local | Equipo/cuenta de prueba | Datos ficticios usados | Resultado observado | Evidencia o error | Responsable que ejecutó |
| --- | --- | --- | --- | --- | --- | --- |
| T30-ON-01 | Pendiente | Pendiente | Pendiente | No ejecutado | Pendiente | Pendiente |
| T30-ON-02 | Pendiente | Pendiente | Pendiente | No ejecutado | Pendiente | Pendiente |
| T30-OFF-01 | Pendiente | Pendiente | Pendiente | No ejecutado | Pendiente | Pendiente |
| T30-OFF-02 | Pendiente | Pendiente | Pendiente | No ejecutado | Pendiente | Pendiente |
| T30-OFF-03 | Pendiente | Pendiente | Pendiente | No ejecutado | Pendiente | Pendiente |

Al registrar un fallo, conserva el texto del error, el comando y la condición de red; no adjuntes `.env`, la clave local, claves RSA, cookies, token CSRF ni datos personales. Un fallo de autorización, clave de Windows, red o API no debe llevar a recrear manualmente registros de manera repetida.

## Criterio de preparación y siguiente fase

T30 queda preparada cuando el equipo dispone de este entorno, datos ficticios identificables, escenarios y formato de evidencia. Queda verificada únicamente después de ejecutar los casos y llenar sus resultados reales.

La siguiente tarea en orden es **T31 — Primeras pruebas de sincronización**. Usará el caso reservado T30-REC-01 y debe separar resultados simulados, locales y contra MariaDB.

## Responsable, fechas y commit

- Responsable: Oscar Aarón Delgadillo Fernández (OD).
- Ventana del cronograma: 12 al 16 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T30): preparar escenarios conectados y offline`.
