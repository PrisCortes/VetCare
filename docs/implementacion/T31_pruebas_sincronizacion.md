# T31 - Primeras pruebas de sincronización

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García Ordaz (BG) |
| Fechas previstas | 14 al 16 de octubre de 2026 |
| Ejecución de evidencia | 21 de noviembre de 2026 |
| Estado | Evidencia simulada y MariaDB temporal aprobada; recorrido real de reconexión en Electron pendiente |

## Alcance

T31 prueba de forma preliminar el intercambio que ya implementa T34. No cambia `sync.php`, la cola local, el cliente Electron ni el contrato de T34. Si una prueba encontrara un defecto reproducible, la corrección se atribuiría a la tarea dueña del comportamiento; completar T31 no es motivo para reescribir T34.

La evidencia se separa en tres niveles:

| Nivel | Caso | Qué comprueba | Resultado |
| --- | --- | --- | --- |
| Simulador local | T31-SIM-01 | Una operación local confirmada se envía al iniciar sesión, conserva `operationId` y desaparece de la cola solo después de la respuesta afirmativa | Aprobado |
| MariaDB temporal con TLS | T31-DB-01 | Propietario → paciente → consulta conserva UUID offline y orden; reintento no duplica; actualización aumenta versión; relación inválida queda bloqueada | Aprobado |
| Electron con red real | T31-RC-01 | Reconectar después de T30-OFF-02 y observar contador, registros centrales y ausencia de duplicados | Pendiente de ejecución manual |

Los dos primeros niveles no sustituyen el tercero: el simulador controla la respuesta de servidor y las tablas temporales no contienen expedientes reales ni una interrupción física de red.

## Evidencia ejecutada

```powershell
npm run test:offline
npm run test:sync:database
```

Resultados observados el 21 de noviembre de 2026:

- `test:offline`: 9 pruebas aprobadas. Incluye el cliente de sincronización simulado, reapertura de SQLite, cola interrumpida que pasa a reintento y bloqueo persistente.
- `test:sync:database`: finalizó correctamente contra MariaDB mediante tablas temporales. Comprueba tres operaciones en orden, UUID conservados, reintento idempotente, actualización y rechazo bloqueado.

La conexión a MariaDB requiere ejecutarse desde un entorno con acceso DNS/TLS al proveedor. En el aislamiento de desarrollo puede fallar antes de ejecutar por resolución de host; se repitió fuera de ese aislamiento y finalizó correctamente. No se cambió ningún dato central real.

## Recorrido manual pendiente: T31-RC-01

Usa el caso reservado de [T30](T30_pruebas_con_sin_internet.md), sin crear otra corrida ni duplicar datos:

1. Completa T30-OFF-02: deja exactamente un propietario, un paciente vinculado y una consulta ficticios en la cola local.
2. Anota el contador, los nombres ficticios y los UUID de la corrida antes de reconectar.
3. Restaura la red, cierra la sesión offline e inicia sesión central con la misma cuenta en Electron.
4. Espera el intento automático o pulsa **Sincronizar pendientes** una vez. El contador debe bajar a cero solamente tras confirmación.
5. Recarga Directorio, Expediente y Carnet según corresponda. El propietario, paciente y consulta deben conservar los UUID anotados y aparecer una sola vez.
6. Registra el resultado en T30-REC-01: fecha/hora, contador inicial/final, estado de cada operación y cualquier mensaje. No copies claves, cookies, CSRF ni `.env`.

Para un fallo de red durante el envío, no recrees registros: conserva la cola y registra si pasa a `retry`. Para un rechazo de servidor, registra el motivo si la interfaz lo muestra y confirma que queda `blocked`; la resolución del conflicto corresponde a T35.

## Límites y continuidad

T31 no prueba recepción incremental de cambios de otros equipos, conflictos concurrentes, eventos sanitarios offline, recuperación desde copias, ni aceptación de clínica. Tampoco declara que la copia local sea una réplica completa después de sincronizar.

La siguiente fase es **T32 — Organizar pendientes de conexión**. Ya existe una implementación de cola para ese alcance; al revisarla se utilizará esta evidencia sin modificar T34 salvo que una prueba posterior demuestre un defecto dentro de T34.

## Responsable, fechas y commit

- Responsable: Brandon García Ordaz (BG).
- Ventana del cronograma: 14 al 16 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T31): documentar primeras pruebas de sincronización`.
