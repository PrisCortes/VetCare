# T39 — Revisar permisos y distintos equipos

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García (BG) |
| Fechas previstas | 2 al 6 de noviembre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Matriz automatizada de permisos y aislamiento revisada; comprobaciones físicas Android/iOS y origen HTTPS central pendientes de ejecución manual |

## Resultado

T39 contrasta los controles implementados con la matriz de T12. Ambos roles clínicos pueden leer, capturar, corregir, sincronizar y restaurar sus propias copias locales; solo administración puede gestionar cuentas. La API no toma el rol enviado por la vista, exige sesión, CSRF y origen en las escrituras, y niega por defecto rutas o acciones no declaradas.

La revisión detectó que restaurar una consulta offline no exigía desbloqueo reciente. Se corrigió: revisar una copia no cambia datos, pero confirmarla requiere una cuenta desbloqueada hace menos de cinco minutos. Los datos offline siguen separados por cuenta, vinculados al dispositivo y cifrados; una cuenta no puede abrir el almacén o snapshots de otra.

## Matriz de evidencia

| Área | Resultado | Evidencia |
| --- | --- | --- |
| Administrador: gestión de cuentas | Aprobado automatizado | Reautenticación, último administrador y revocación de sesiones: `tests/auth.test.mjs` |
| Veterinario: acciones clínicas | Aprobado automatizado | `clinical.read` y `clinical.write`; rechazo de `users.manage`: `tests/auth.test.mjs` |
| Petición anónima, CSRF y origen externo | Aprobado automatizado | Contratos PHP y rutas protegidas: `tests/auth.test.mjs`, `tests/environment.test.mjs` |
| Cuenta A/B en el mismo Windows | Aprobado automatizado | Almacén cifrado por cuenta, permisos vigentes y pendientes aislados: `tests/offline.test.mjs` |
| Sesión offline, reloj y expiración | Aprobado automatizado | Bloqueo por inactividad, 72 horas y retroceso de reloj: `tests/offline.test.mjs` |
| Restauración sensible | Aprobado automatizado | Copia verificada, cuenta coincidente, confirmación y desbloqueo menor a cinco minutos: `tests/offline.test.mjs` |
| Electron seguro | Aprobado automatizado | Context isolation, sandbox, puente limitado y secretos filtrados: `tests/desktop-integration.test.mjs` |
| Windows/Electron | Pendiente de recorrido manual | Ejecutar los flujos indicados abajo en el equipo de prueba |
| Chrome Android y Safari iOS | Pendiente de dispositivo real | CSS responsivo existe; no se declara compatibilidad sin navegación real |
| Origen HTTPS central | Pendiente de despliegue | Requiere URL publicada y servicio central configurado |

## Cómo comprobar esta fase

```powershell
npm test
npm run check
npm run test:offline
npm run test:integration
```

En Windows/Electron, prueba con dos cuentas ficticias distintas: prepara ambas para acceso offline, crea un pendiente con la cuenta A, bloquea, desbloquea B y confirma que no aparecen los registros, pendientes ni copias de A. Vuelve a A y confirma que siguen disponibles. Con una cuenta veterinaria intenta abrir **Cuentas**: debe permanecer inaccesible; con una administradora verifica que la gestión exige autenticación reciente.

Para móvil, abre el origen conectado desde Chrome Android y Safari iOS en equipos físicos. Comprueba inicio de sesión, lista de pacientes, expediente, carnet y consulta en vertical, sin cortes horizontales ni controles táctiles menores a los previstos. Registra modelo, navegador y versión antes de declarar la fila aprobada.

## Responsable, fechas y commit

- Responsable: Brandon García (BG).
- Ventana del cronograma: 2 al 6 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T39): revisar permisos y aislamiento entre equipos`.
