# T33 - Evaluar intercambio inicial (M05a)

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García Ordaz (BG) |
| Fechas previstas | 19 al 23 de octubre de 2026 |
| Corte de evidencia | 21 de noviembre de 2026 |
| Estado | Corte técnico con evidencia parcial conforme; recorrido de reconexión real y conflictos pendientes |

## Decisión del corte M05a

El intercambio inicial de propietarios, pacientes y consultas no presenta un bloqueo técnico en las pruebas automatizadas ni en MariaDB temporal. La conexión central respondió `DB_OK` con TLS y la prueba de sincronización confirmó orden, UUID, reintento idempotente y bloqueo.

El corte **no equivale a aprobación completa de sincronización**. Sigue pendiente el recorrido T31-RC-01 en Electron, con una cola creada sin conexión y una reconexión física observada. También quedan fuera de este corte la descarga de cambios de otros equipos, los conflictos concurrentes y los eventos sanitarios offline.

## Evidencia evaluada

| Caso | Evidencia | Resultado | Alcance acreditado |
| --- | --- | --- | --- |
| T33-DB-01 | `npm run db:check` | Aprobado: `DB_OK`, `tls: true` | Conectividad cifrada hacia MariaDB desde una sesión con red permitida |
| T33-DB-02 | `npm run test:sync:database` | Aprobado | Tablas temporales: propietario → paciente → consulta, UUID local, reintento idempotente, actualización y rechazo bloqueado |
| T33-SIM-01 | `npm run test:offline` (T31) | Aprobado: 9 pruebas | Cola local, recuperación de `sending`, reintento, bloqueo y confirmación durable simulada |
| T33-RC-01 | Recorrido T31-RC-01 en Electron | Pendiente | Conteo real antes/después, reingreso central y ausencia de duplicados en la interfaz |

Las tablas utilizadas por `test:sync:database` se crean como temporales y se eliminan con la conexión. No se crearon ni alteraron expedientes reales. El diagnóstico y la prueba central pueden fallar dentro de un entorno aislado que no resuelva el proveedor; para este corte se ejecutaron en una sesión con acceso TLS permitido.

## Hallazgos y pendientes explícitos

| ID | Resultado | Acción posterior |
| --- | --- | --- |
| P-T33-01 | Falta observar la reconexión real de Electron con una cola de T30 | Ejecutar y registrar T31-RC-01 antes de considerar el flujo operativo en Windows |
| P-T33-02 | La copia local no descarga cambios de otros equipos | T35 definirá conciliación y recepción de cambios |
| P-T33-03 | Vacunaciones y desparasitaciones no se capturan offline | Mantenerlas fuera de la cola actual; no declararlas sincronizadas |
| P-T33-04 | No se probó corte de red durante una solicitud central en una sesión de usuario | Registrar el estado `retry` y la conservación del `operationId` durante el recorrido manual |

No se encontró un defecto automático que requiera modificar T34. Los pendientes son límites de evidencia o de fases posteriores, no resultados que deban ocultarse mediante un cambio de implementación.

## Cómo repetir la evaluación

Desde la raíz, en una sesión con acceso a MariaDB:

```powershell
npm run db:check
npm run test:sync:database
npm run test:offline
npm run check
```

Luego realiza T31-RC-01 usando la corrida ficticia de T30:

1. Deja un propietario, paciente y consulta ficticios en estado pendiente desde Electron sin conexión.
2. Anota contador y UUID antes de reconectar.
3. Restaura la red e inicia sesión con la misma cuenta.
4. Comprueba que el contador llega a cero solo después de la confirmación y que cada UUID aparece una vez en la vista central.
5. Si hay fallo, registra estado de la cola (`retry` o `blocked`), mensaje y condición de red; no recrees los registros.

## Continuidad

El siguiente trabajo en el orden del cronograma es **T34 — Enviar y actualizar información**. Su implementación ya existe y fue usada como objeto de prueba en este corte; por ello la siguiente acción sobre T34 es una revisión de evidencia, no una reimplementación. T35 abordará conflictos y cambios concurrentes.

## Responsable, fechas y commit

- Responsable: Brandon García Ordaz (BG).
- Ventana del cronograma: 19 al 23 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T33): evaluar intercambio inicial M05a`.
