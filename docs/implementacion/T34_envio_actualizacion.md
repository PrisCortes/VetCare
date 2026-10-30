# T34 - Enviar y actualizar información

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Priscila Cortés Ramírez (PC) |
| Fechas previstas | 22 al 30 de octubre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Envío idempotente de la cola offline integrado; recepción completa de cambios y conflictos siguen pendientes |

## Resultado

Al iniciar sesión con conexión, Electron revisa la cola local y envía los pendientes uno a la vez, respetando su orden de creación. También hay un botón **Sincronizar pendientes** para repetir el intercambio sin crear registros nuevos.

La API central `POST /api/v1/sync/push` acepta únicamente operaciones de propietarios, pacientes y consultas creadas por la cuenta autenticada. Conserva los UUID generados sin conexión, por lo que un paciente sigue refiriendo al mismo propietario y una consulta al mismo paciente. La API no acepta SQL, tipos arbitrarios ni una identidad de cuenta enviada por la vista.

Cada operación reutiliza su `operationId`. El servidor registra el resultado junto con la entidad y sus versiones dentro de la transacción; si se pierde una respuesta, el reintento recibe ese mismo resultado durable en vez de crear un duplicado. Solo entonces Electron elimina el pendiente y cambia la revisión local correspondiente a `confirmed`.

## Reintentos y resultados

- Si no hay respuesta confirmada, la operación conserva el mismo ID, entra en `retry` y espera un intervalo progresivo de hasta cinco minutos.
- Si el servidor rechaza una carga, versión o relación, pasa a `blocked`, conservando el motivo cifrado para revisión. No se borra ni se reenvía indefinidamente.
- El procesamiento se detiene al primer reintento o bloqueo para mantener la dependencia propietario → paciente → consulta.
- Una petición autenticada con CSRF es obligatoria para el envío. Al cerrar sesión o perder autorización no se considera que algo se haya sincronizado.

## Alcance actual

T34 envía propietarios, pacientes y consultas que ya podían capturarse offline en T25. Las vacunas y desparasitaciones se guardan centralmente en T27, pero todavía no se capturan offline y por eso no entran en esta cola.

La respuesta central actualiza la entidad que se confirmó. La descarga incremental de cambios de otros equipos y la conciliación de versiones concurrentes se completarán en T35; esta fase no sustituye ese tratamiento ni declara una copia local globalmente actualizada.

## Cómo comprobar esta fase

Desde la raíz:

```powershell
npm run test:sync:database
npm run test:offline
npm test
npm run check
npm run dev:desktop
```

La prueba de sincronización usa tablas temporales de MariaDB y no altera expedientes reales.

En Electron:

1. Inicia sesión con conexión y pulsa **Preparar sin conexión** si la cuenta aún no está preparada.
2. Cierra sesión, desconecta la red y entra mediante **Acceso sin conexión**.
3. Crea un propietario ficticio, un paciente vinculado y una consulta. El aviso debe indicar tres operaciones pendientes.
4. Cierra sesión, reconecta la red e inicia sesión con la misma cuenta. El inicio intenta sincronizar automáticamente; también puedes pulsar **Sincronizar pendientes**.
5. El aviso debe indicar cuántas operaciones se enviaron y el contador debe bajar a cero solo después de la confirmación. Recarga el directorio central y comprueba que aparecen el propietario, paciente y consulta sin duplicados.
6. Para probar un fallo de red, desconéctala antes de sincronizar. Los pendientes deben permanecer, ahora para reintentar; no recrees manualmente los registros.

## Evidencia

- `npm run test:sync:database`: UUID offline, orden de dependencias, reintento idempotente y bloqueo comprobados contra MariaDB mediante tablas temporales.
- `npm run test:offline`: cola y cliente de sincronización comprobados con simulador de servidor.
- Regresión local, sintaxis y build se ejecutan antes de cerrar la fase.

## Responsable, fechas y commit

- Responsable: Priscila Cortés Ramírez (PC).
- Ventana del cronograma: 22 al 30 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T34): sincronizar pendientes offline con MariaDB`.
