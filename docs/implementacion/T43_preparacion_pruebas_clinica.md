# T43 — Preparar pruebas con la clínica

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Brandon García Ordaz (BG) |
| Fechas previstas | 9 y 10 de noviembre de 2026 |
| Preparación | 21 de noviembre de 2026 |
| Estado | Guion y registros preparados; participantes, equipos y sesiones reales pendientes de confirmación |

## Modalidad y límites

La modalidad acordada sigue siendo **demostración escolar**. Este documento prepara sesiones observables, pero no atribuye participación, firma, criterio clínico ni aceptación a personal de la clínica que no haya participado realmente.

Usa solamente cuentas de prueba y datos ficticios. No capturar nombres de propietarios, expedientes, contraseñas, llaves, cookies ni pantallas con datos clínicos reales. Los participantes pueden registrarse con iniciales o un alias acordado; el rol de cada uno debe ser real y voluntario.

## Participantes y equipos por confirmar

| Elemento | Mínimo para las sesiones | Estado al preparar T43 |
| --- | --- | --- |
| P01 | Operador de prueba 1, realiza las tres tareas sin ayuda | Por confirmar |
| P02 | Operador de prueba 2, distinto de P01 | Por confirmar |
| Observador | Registra tiempo, asistencia y hallazgos; no guía durante la tarea | Brandon García Ordaz (BG), sujeto a disponibilidad |
| Equipo Windows | Windows con Electron, perfil offline de prueba y red controlable | Por confirmar |
| Navegador web | Chrome moderno, sesión de prueba y origen HTTPS de staging | Pendiente de staging T41/T42 |
| Móvil | Chrome Android y Safari iOS para la matriz posterior | Pendiente; no bloquea preparar la sesión de escritorio |

No se inicia una sesión presentada como “con la clínica” hasta confirmar P01, P02, fecha, equipo y modalidad. Si solo hay compañeros de demostración, se registra como simulación escolar.

## Datos y condiciones previas

Para cada sesión el observador genera un prefijo único, por ejemplo `T43-20261121-S1`. Se emplean propietario, paciente y consulta ficticios con ese prefijo y se eliminan mediante baja lógica al concluir, cuando sea seguro hacerlo.

Antes de iniciar:

```powershell
npm test
npm run check
npm run build
npm run db:diagnose
npm run dev:desktop
```

Para una sesión conectada se requiere además que el origen HTTPS de staging y T41-RC-01 estén disponibles. Si faltan, se puede practicar el guion en modo demostración, pero el resultado no cierra M05b ni H5.

## Guion de tareas críticas (RE16)

El observador lee cada instrucción una vez, inicia el cronómetro y no ofrece indicaciones de navegación, campos ni botones. Solo puede intervenir para detener una condición de seguridad o registrar un bloqueo. Un error corregido autónomamente no equivale a asistencia.

| ID | Instrucción al participante | Resultado observable | Éxito sin ayuda |
| --- | --- | --- | --- |
| T43-US-01 | “Registra el paciente ficticio indicado para su propietario de prueba.” | Paciente vinculado y visible en directorio | Registro correcto sin sugerencias |
| T43-US-02 | “Guarda la consulta ficticia de ese paciente.” | Consulta visible con fecha y motivo indicados | Guardado confirmado sin sugerencias |
| T43-US-03 | “Encuentra la consulta que acabas de registrar en su historial.” | Historial del paciente correcto muestra la consulta | Consulta localizada sin sugerencias |

Se considera cumplimiento RE16 solo si al menos 90 % de las tareas críticas de ambas sesiones se completan sin asistencia. Con dos participantes y tres tareas son seis observaciones: se requieren al menos seis éxitos sin ayuda para alcanzar 90 %.

## Registro para T44 y T46

| Sesión | Fecha/hora | Modalidad (escolar/clínica) | Participante/alias | Equipo/navegador | T43-US-01 | T43-US-02 | T43-US-03 | Asistencia recibida | Tiempo total | Hallazgos | Responsable de registro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 (T44) | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | BG |
| 2 (T46) | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | BG |

Para cada hallazgo, registrar severidad, pasos reproducibles, evidencia sin datos sensibles, decisión y, si corresponde, caso de regresión para T45. Un bloqueo de acceso, pérdida/corrupción de datos o imposibilidad de completar el flujo esencial se marca como bloqueante y se deriva antes de continuar.

## Criterio de preparación

T43 queda preparado cuando este guion, los datos ficticios, la tabla de registro y la lista de equipos están disponibles. La confirmación real de personas/equipos y los resultados pertenecen a T44 y T46; no se sustituyen con esta preparación.

## Responsable, fechas y commit

- Responsable: Brandon García Ordaz (BG).
- Ventana del cronograma: 9 y 10 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T43): preparar guion de pruebas con la clínica`.
