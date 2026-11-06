# T40 — Revisar funciones y requisitos

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García (BG) |
| Fechas previstas | 3 al 6 de noviembre de 2026 |
| Revisión | 21 de noviembre de 2026 |
| Estado | Núcleo trazado contra evidencia automatizada; requisitos que exigen despliegue, medición o participantes permanecen pendientes |

## Criterio de revisión

Esta tarea revisa los requisitos RE01–RE22 de [T5](../gestion/T05_funciones_condiciones.md) contra código, pruebas y evidencia disponible. **Aprobado automatizado** no equivale a aprobación clínica ni a despliegue; **parcial** significa que existe una parte implementada, pero falta una condición explícita del requisito.

| Requisito | Resultado | Evidencia actual / condición pendiente |
| --- | --- | --- |
| RE01 Propietarios | Aprobado automatizado | `tests/owners.test.mjs`, `tests/owners-database.php`; falta recorrido real central documentado |
| RE02 Pacientes | Aprobado automatizado | `tests/patients.test.mjs`, `tests/patients-database.php` |
| RE03 Consultas y expediente | Aprobado automatizado | `tests/consultations.test.mjs`, `tests/consultations-database.php`, historial y versiones |
| RE04 Carnet sanitario | Aprobado automatizado | `tests/sanitary-events.test.mjs`, `tests/history-database.php`, próxima fecha opcional |
| RE05 Historial | Aprobado automatizado | `tests/history.test.mjs`, `tests/history-database.php`, paciente y paginación aislados |
| RE06 Offline Windows | Aprobado automatizado | `tests/offline.test.mjs`; falta recorrido manual completo con el equipo de prueba |
| RE07 Sincronización automática | Parcial | Se envía al iniciar sesión conectada y mediante botón; falta evidencia de cierre normal, recuperación de conectividad y servicio HTTPS publicado |
| RE08 Conflictos/versiones | Aprobado automatizado | `tests/sync-database.php`, conflicto LWW y versiones conservadas; falta ensayo distribuido real |
| RE09 Snapshot/restauración | Aprobado automatizado | `tests/offline.test.mjs`, copia cifrada, detección de alteración y restauración como revisión nueva |
| RE10 Web responsiva independiente | Parcial | Diseño responsivo y modo HTTPS preparados; falta origen central publicado y prueba desde red externa |
| RE11 Captura móvil | Parcial | Formularios y CSS responsivo existen; falta Chrome Android/Safari iOS físico |
| RE12 Acceso y permisos | Aprobado automatizado | `tests/auth.test.mjs`, `tests/desktop-integration.test.mjs`, T39 |
| RE13 Rendimiento | Pendiente | Faltan tres mediciones fría/caliente con dispositivo, red y datos registrados |
| RE14 Integridad de intercambio | Parcial | Reintentos, UUID, cola, conflicto y restauración se prueban; falta staging M05b y reconexión real |
| RE15 Compatibilidad | Parcial | Windows/Electron y CSS cubiertos por código; faltan Android e iOS/Safari reales |
| RE16 Usabilidad sin ayuda | Pendiente | Requiere dos sesiones con participantes y registro de asistencia |
| RE17 Calidad funcional núcleo | Parcial | 60 pruebas pasan; falta ejecución de todos los casos obligatorios y evidencia de H5 |
| RE18 Cero bloqueantes | Pendiente | Solo puede evaluarse en el cierre de pruebas |
| RE19 Dos sesiones de validación | Pendiente | No se han registrado participantes o sesiones reales |
| RE20 Manual y despliegue | Pendiente | Manual final, API publicada e instalador Windows corresponden a fases posteriores |
| RE21 Cambios controlados | Parcial | Documentación por fase y commits sugeridos; los commits y la revisión final los realiza el usuario |
| RE22 Plazo y presupuesto | Pendiente documental | No se inventan consumo, desembolso ni aceptación final |

## Resultado de regresión disponible

En esta revisión se mantiene la última ejecución local de:

```powershell
npm test
npm run check
npm run build
```

Resultado: 60 pruebas automatizadas aprobadas, sintaxis correcta y build web generado. Las pruebas que usan MariaDB temporal, HTTP local o dispositivos reales se deben repetir desde el equipo habilitado; no se sustituyen por esta matriz.

## Siguientes decisiones

No se implementa un cambio funcional en T40. Los hallazgos se trasladan sin ocultarlos:

1. T41 debe comprobar sincronización de staging y reconexión.
2. T42 debe decidir H5 solo después de ejecutar los criterios obligatorios pendientes.
3. T43–T48 deben cubrir dispositivos, rendimiento, participantes, defectos y cierre.
4. T50 requiere despliegue/instalador antes de declarar RE20 cumplido.

## Responsable, fechas y commit

- Responsable: Brandon García (BG).
- Ventana del cronograma: 3 al 6 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `docs(T40): revisar trazabilidad de requisitos del núcleo`.
