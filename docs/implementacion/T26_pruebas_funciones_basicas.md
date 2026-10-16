# T26 - Comprobar funciones básicas

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García Ordaz (BG) |
| Fechas previstas | 12 al 16 de octubre de 2026 |
| Ejecución de evidencia | 20 de noviembre de 2026 |
| Estado | Pruebas automatizadas y centrales del alcance actual aprobadas; recorridos visuales, carnet y sincronización siguen fuera de este corte |

## Objetivo y alcance

Esta tarea reúne evidencia de las funciones que ya existen en el núcleo: acceso, propietarios, pacientes, validación de atención, consultas, historial y captura offline. No anticipa tareas posteriores ni convierte en completados el carnet sanitario, la sincronización, los snapshots, la web móvil o las pruebas con participantes.

Las reglas de campos y validaciones continúan siendo candidatas hasta que se cierren las decisiones D-T5-01, D-T5-02 y D-T5-03. Este resultado acredita comportamiento técnico con datos ficticios, no validación clínica.

## Ejecución realizada

| Evidencia | Comando o alcance | Resultado |
| --- | --- | --- |
| Regresión del núcleo | `npm test` | Aprobada: 50 pruebas, 0 fallos |
| Sintaxis | `npm run check` | PHP y JavaScript correctos |
| Conexión central | `npm run db:check` | `DB_OK` con TLS |
| T23: consultas y tratamientos | `npm run test:consultations:database` | Aprobada contra MariaDB mediante tablas temporales |
| T24: historial y versiones | `npm run test:history:database` | Aprobada contra MariaDB mediante tablas temporales |
| T25: cifrado, persistencia y cola local | Incluida en `npm test` (`tests/offline.test.mjs`) | Aprobada con protector simulado y SQLite temporal |

Las pruebas centralizadas de T23 y T24 crean tablas temporales durante la conexión y no alteran propietarios, pacientes ni expedientes reales. Cubren guardado idempotente, correcciones, versiones, autoría, paciente inactivo, filtros, paginación, último peso y aislamiento entre pacientes.

## Cobertura comprobada

| Función actual | Evidencia | Resultado |
| --- | --- | --- |
| Propietarios y pacientes | Validaciones, vínculo, baja lógica y contexto del paciente | Aprobado en la regresión automatizada |
| Atención | Fechas, unidades, campos obligatorios, errores y vista previa no guardada | Aprobado en la regresión automatizada |
| Consulta (T23) | Guardado, reintento con `operationId`, corrección, versiones y conflicto | Aprobado en MariaDB temporal |
| Historial (T24) | Consulta por paciente, filtros, cursor, edad/peso históricos y versiones de solo lectura | Aprobado en MariaDB temporal |
| Offline (T25) | Cifrado de cargas, aislamiento por cuenta, reapertura, inactividad y cola persistente | Aprobado con protector simulado |

## Límite de entorno registrado

Al ejecutar `npm run test:offline:windows` en este entorno, Electron no pudo verificar la protección de secretos de Windows. La prueba no abrió una ventana clínica ni modificó datos. Esto no invalida la confirmación del usuario de que T25 está terminada, pero tampoco se presenta aquí como una confirmación independiente de `safeStorage`/DPAPI en esta ejecución.

Para conservar una evidencia reproducible de la plataforma objetivo, la comprobación puede ejecutarse desde una sesión Windows de usuario con:

```powershell
npm run test:offline:windows
```

## Cómo comprobar esta fase

Desde la raíz de VetCare, con las variables de conexión configuradas y sin un servidor local anterior que interfiera:

```powershell
npm test
npm run check
npm run db:check
npm run test:consultations:database
npm run test:history:database
```

Los tres últimos comandos requieren la conexión MariaDB TLS. Las pruebas de consultas e historial usan tablas temporales, por lo que no deben crear ni modificar expedientes reales. Para repetir la comprobación nativa de T25 desde el equipo Windows objetivo, ejecutar también:

```powershell
npm run test:offline:windows
```

Resultados esperados: 50 pruebas aprobadas, sintaxis correcta, `DB_OK` con `tls: true` y finalización exitosa de las dos pruebas de base de datos. Si la prueba de Electron falla, registrar el mensaje y el contexto de Windows; no presentar el cifrado nativo como comprobado por esa ejecución.

## Responsable, fechas y commit

- Responsable del cronograma: Brandon García Ordaz (BG).
- Ventana correspondiente: 12 al 16 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T26): comprobar funciones básicas del núcleo`.

## Fuera del alcance de T26

- Persistencia de vacunas, desparasitaciones y carnet sanitario (T27–T29).
- Sincronización de pendientes offline, reintentos en red y resolución distribuida de conflictos (T32, T34 y T35).
- Snapshots/restauración (T36–T37).
- Recorrido visual formal en Electron, navegador móvil y matriz de equipos (T30, T39 y tareas de sesiones).
- Medición de rendimiento, pruebas con participantes y aprobación clínica.
- Receta emitida como documento independiente. Actualmente el tratamiento pertenece a la consulta; no hay estados de emisión/sustitución ni motivo obligatorio de corrección.

## Resultado

El núcleo disponible supera las pruebas automatizadas y las integraciones reales de MariaDB correspondientes a T23 y T24. T26 no declara terminadas funciones de tareas posteriores ni sustituye pruebas visuales o de aceptación. El siguiente desarrollo funcional habilitado es T27: vacunas y desparasitaciones.
