# T44 — Primera sesión de pruebas

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García Ordaz (BG) |
| Fechas previstas | 10 al 13 de noviembre de 2026 |
| Estado | Sesión no ejecutada: acta preparada, participante y resultado pendientes |

## Regla de evidencia

Esta tarea requiere una persona que realice el guion de [T43](T43_preparacion_pruebas_clinica.md). Una prueba automatizada, una revisión de código o una ejecución hecha por el observador no se registra como una sesión de usabilidad sin ayuda.

La sesión puede ser una demostración escolar. En ese caso, indícalo expresamente; no se atribuye participación clínica a una persona que no participó. Usa un alias o iniciales del participante si no desea que su nombre aparezca en el registro.

## Precondiciones

1. Confirmar participante P01, equipo y modalidad (escolar o clínica).
2. Generar el prefijo ficticio `T44-AAAAMMDD-S1`.
3. Ejecutar en el equipo de prueba:

   ```powershell
   npm test
   npm run check
   npm run build
   npm run dev:desktop
   ```

4. No continuar como sesión conectada/staging si no está disponible el origen HTTPS requerido por T41/T42. La sesión puede practicar el flujo local, registrando esa limitación.
5. El observador abre la tabla siguiente y lee cada instrucción de T43 una sola vez.

## Acta de sesión 1

| Campo | Registro |
| --- | --- |
| Fecha y hora local | Pendiente |
| Modalidad | Pendiente (escolar o clínica) |
| Participante / alias | Pendiente |
| Observador | Pendiente |
| Equipo / SO / navegador o Electron | Pendiente |
| Red y origen usado | Pendiente |
| Prefijo de datos ficticios | Pendiente |
| T43-US-01: registrar paciente | Pendiente (éxito sin ayuda / éxito con ayuda / fallo) |
| T43-US-02: guardar consulta | Pendiente (éxito sin ayuda / éxito con ayuda / fallo) |
| T43-US-03: consultar historial | Pendiente (éxito sin ayuda / éxito con ayuda / fallo) |
| Tiempo total | Pendiente |
| Asistencia proporcionada | Pendiente |
| Hallazgos y severidad | Pendiente |
| Resultado de la sesión | No ejecutada |

## Clasificación de hallazgos

| Severidad | Criterio | Acción |
| --- | --- | --- |
| Bloqueante | Pérdida/corrupción de datos, caída sin recuperación o flujo esencial imposible | Detener el caso, conservar evidencia sanitizada y derivar a T45 antes de una nueva sesión |
| Alta | La tarea crítica falla o exige asistencia no prevista | Registrar pasos y prueba de regresión para T45 |
| Media/baja | Comprensión, etiqueta, navegación o detalle sin pérdida de datos | Registrar para priorización; no presentar como ausencia de hallazgo |

Los porcentajes de RE16 y la conclusión de RE19 no se calculan con esta sesión sola. T46 debe aportar una segunda sesión real y su regresión.

## Criterio de terminación

T44 se podrá declarar ejecutada solo al completar el acta con datos reales, tareas observadas y hallazgos o confirmación de su ausencia. Hasta entonces está correctamente preparada, pero no aprobada.

## Responsable, fechas y commit

- Responsable: Brandon García Ordaz (BG).
- Ventana del cronograma: 10 al 13 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario después de registrar el resultado real: `test(T44): registrar primera sesión de pruebas`.
