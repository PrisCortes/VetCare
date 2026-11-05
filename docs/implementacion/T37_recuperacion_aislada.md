# T37 — Comprobar recuperación

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Oscar Delgadillo (OD) |
| Fechas previstas | 29 de octubre al 5 de noviembre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Restauración aislada de consultas offline implementada y probada; recuperación completa de instalación y MariaDB no forman parte de esta fase |

## Resultado

En modo offline, el control **Restaurar consulta** permite seleccionar únicamente una copia `copy_verified`. Antes de habilitar la confirmación, VetCare descifra y valida el archivo independiente, compara su huella, ámbito de cuenta, propietario, paciente e identificadores, y muestra la razón de la consulta de la copia frente a la versión local actual.

La confirmación no reemplaza registros directamente. Crea una nueva revisión local de la misma consulta, conserva las revisiones anteriores, añade una operación `restoreConsultation` a la cola y genera su propio snapshot de recuperación. Cuando se sincronice, el servidor recibe esa operación como una corrección identificada, con las mismas garantías de idempotencia y conflicto que una actualización normal.

La restauración se rechaza si falta una referencia, la copia no está verificada, pertenece a otra cuenta, fue alterada, o existe una edición local pendiente. No recupera permisos, sesiones, claves, cursores ni propietarios/pacientes desde un snapshot.

## Cómo comprobar esta fase

Prueba automatizada:

```powershell
npm run test:offline
npm test
npm run check
npm run build
```

La prueba T37 protege una consulta, confirma una corrección posterior y restaura la copia anterior. Comprueba que la restauración termina como versión 3, conserva las tres revisiones y deja una operación `restoreConsultation` pendiente, sin eliminar la versión posterior.

Prueba manual con datos ficticios:

1. Inicia `npm run dev:desktop`, prepara y desbloquea una cuenta offline.
2. Crea propietario, paciente y una consulta; sincronízalos cuando tengas conexión.
3. Regresa a offline y corrige esa consulta. Sincroniza nuevamente para no dejar esa corrección pendiente.
4. En **Restaurar consulta**, selecciona la copia anterior, pulsa **Revisar copia** y confirma la restauración como nueva revisión.
5. Verifica que la banda offline aumenta sus pendientes y que la consulta conserva la versión anterior y la restaurada; nunca debe desaparecer la corrección previa.

No pruebes restauración con expedientes reales. La recuperación integral de una instalación y la restauración de MariaDB requieren un entorno aislado, conciliación de operaciones y una fase posterior de evidencia.

## Responsable, fechas y commit

- Responsable: Oscar Delgadillo (OD).
- Ventana del cronograma: 29 de octubre al 5 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T37): restaurar consultas desde copias verificadas`.
