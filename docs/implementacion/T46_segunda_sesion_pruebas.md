# T46 — Segunda sesión de pruebas

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García Ordaz (BG) |
| Fechas previstas | 16 al 20 de noviembre de 2026 |
| Estado | Sesión no ejecutada: depende de T44 y T45; acta de regresión preparada |

## Propósito y dependencia

T46 repite el guion de [T43](T43_preparacion_pruebas_clinica.md) con un segundo participante para confirmar la regresión de los hallazgos de T44 y completar la evidencia de RE16/RE19. No puede reemplazar la sesión 1 ni usar a la misma persona como si fueran dos participantes.

Antes de iniciar, T44 debe incluir el resultado real de P01 y T45 debe enumerar sus hallazgos, decisiones y pruebas repetidas. Si alguno sigue pendiente, T46 puede realizarse como demostración escolar exploratoria, pero no se calcula como validación final de dos sesiones.

## Precondiciones

1. Confirmar P02, distinto de P01, junto con modalidad y equipo.
2. Revisar la lista de cambios/casos de regresión de T45. No ocultar un defecto abierto.
3. Crear datos ficticios con prefijo `T46-AAAAMMDD-S2`.
4. Ejecutar en el equipo usado para la sesión:

   ```powershell
   npm test
   npm run check
   npm run build
   npm run dev:desktop
   ```

5. El observador lee las instrucciones T43-US-01, T43-US-02 y T43-US-03 sin orientar al participante.

## Acta de sesión 2 y regresión

| Campo | Registro |
| --- | --- |
| Fecha y hora local | Pendiente |
| Modalidad | Pendiente (escolar o clínica) |
| Participante / alias P02 | Pendiente |
| Confirmación de que P02 es distinto de P01 | Pendiente |
| Observador | Pendiente |
| Equipo / SO / navegador o Electron | Pendiente |
| Red y origen usado | Pendiente |
| Prefijo de datos ficticios | Pendiente |
| T43-US-01: registrar paciente | Pendiente (éxito sin ayuda / éxito con ayuda / fallo) |
| T43-US-02: guardar consulta | Pendiente (éxito sin ayuda / éxito con ayuda / fallo) |
| T43-US-03: consultar historial | Pendiente (éxito sin ayuda / éxito con ayuda / fallo) |
| Casos de regresión T45 | Pendiente |
| Asistencia proporcionada | Pendiente |
| Tiempo total | Pendiente |
| Hallazgos y severidad | Pendiente |
| Resultado de la sesión | No ejecutada |

## Cálculo posterior de RE16

Con T44 y T46 completas hay seis tareas críticas observadas. Registra cada una como **éxito sin ayuda**, **éxito con ayuda** o **fallo**. RE16 se cumple únicamente con seis de seis éxitos sin ayuda; cinco de seis (83.3 %) no alcanza el mínimo de 90 %.

Un hallazgo bloqueante, una tarea fallida o una corrección que no pase regresión permanece visible para T47/T48. La modalidad escolar se conserva en todo informe; no equivale a aceptación clínica.

## Criterio de terminación

T46 se puede declarar ejecutada al completar esta acta con P02 real, comprobar los casos de regresión de T45 y consolidar el resultado de las seis tareas junto con T44. Hasta entonces la fase está preparada, no aprobada.

## Responsable, fechas y commit

- Responsable: Brandon García Ordaz (BG).
- Ventana del cronograma: 16 al 20 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario después de registrar la sesión: `test(T46): registrar segunda sesión y regresión`.
