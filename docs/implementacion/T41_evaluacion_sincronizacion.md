# T41 — Evaluar sincronización en pruebas

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Oscar Aarón Delgadillo Fernández (OD) |
| Fechas previstas | 6 al 9 de noviembre de 2026 |
| Revisión técnica | 21 de noviembre de 2026 |
| Estado | Evidencia local conforme; staging M05b y recorrido físico pendientes |

## Alcance y ajuste detectado

T41 revisa el intercambio crítico de la cola durable: conservación ante fallo, reintento identificable, confirmación central sin duplicados y recuperación de conectividad. No convierte la disponibilidad de MariaDB en una aprobación de staging ni usa expedientes clínicos reales.

La revisión detectó que T34 enviaba al iniciar sesión y por acción manual, pero faltaban dos intentos requeridos por RE07: recuperar conectividad y cerrar normalmente. Se corrigió esa brecha, atribuida a **T34**, durante esta evaluación:

- Electron intenta enviar la cola durante el cierre normal, con límite de cuatro segundos.
- La interfaz pide sincronización automáticamente al recibir el evento de red `online`.
- El límite de la petición es controlado. Una respuesta ausente deja la operación en `retry`; la cola local durable no se borra ni se marca como confirmada.

El evento del navegador es un disparador de reintento, no una confirmación de internet o de MariaDB. La confirmación continúa dependiendo de la respuesta autenticada de `sync/push`.

## Evidencia de esta revisión

| Caso | Resultado | Evidencia |
| --- | --- | --- |
| T41-SIM-01: cola durable e idempotencia | Conforme | `npm run test:offline`: 11 pruebas aprobadas, incluida confirmación durable sin recrear la entidad |
| T41-APP-01: reconexión/cierre controlado | Conforme automatizado | Prueba T41 en `tests/desktop-integration.test.mjs`: evento `online`, intento de cierre y plazo de petición verificados |
| T41-DB-01: diagnóstico de MariaDB | Conforme | `npm run db:diagnose` fuera del aislamiento: `DB_OK`, TLS activo |
| T41-DB-02: lote contra tablas temporales | Pendiente de repetición | `npm run test:sync:database` no emitió un resultado aprobatorio en esta ejecución; no se acredita como evidencia M05b |
| T41-STG-01: API HTTPS publicada | Pendiente | No hay `VETCARE_APP_URL` configurado para un origen central de staging |
| T41-RC-01: reconexión física en Electron | Pendiente | Requiere Windows, red controlada y cuenta de prueba; no se simula como si fuera staging |

## Cómo completar el recorrido de staging

Configura un origen HTTPS de **staging** con datos ficticios y nunca copies secretos al registro. Antes de comenzar, ejecuta:

```powershell
npm run db:diagnose
npm run test:sync:database
npm run test:offline
npm run dev:desktop
```

Después registra T41-RC-01 con un identificador de prueba único:

1. Prepara acceso offline, desconecta la red y crea un propietario, paciente y consulta ficticios. Anota contador y UUID, sin anotar claves ni cookies.
2. Vuelve a conectar la red. Si el inicio conectado ya ocurrió y existe una operación en `retry`, espera el evento de red: no pulses **Sincronizar pendientes** durante esta variante.
3. Comprueba que el contador baja solo tras respuesta del servidor y que directorio y expediente muestran cada UUID exactamente una vez.
4. Para probar cierre, provoca un envío no confirmado (por ejemplo, corta la red después de iniciar sesión), cierra Electron normalmente y vuelve a abrirlo con la red restaurada. Debe conservar la cola hasta la confirmación; no recrees los registros.
5. Registra fecha/hora, equipo, red, contador inicial/final, UUID, resultado de cada operación y error sanitizado si lo hubiera. Después aplica baja lógica a los datos ficticios.

El lote de `test:sync:database` crea únicamente tablas temporales. Si vuelve a fallar pese a `DB_OK`, registra su código sanitizado y permisos de tablas temporales; no modifiques la base clínica para "hacer que pase" la prueba.

## Criterio M05b

M05b solo puede declararse conforme cuando T41-DB-02, T41-STG-01 y T41-RC-01 estén aprobados, con evidencia antes/después que demuestre cero pérdida y cero duplicación irreversible. Al 21 de noviembre de 2026 ese criterio permanece pendiente.

## Responsable, fechas y commit

- Responsable: Oscar Aarón Delgadillo Fernández (OD).
- Ventana del cronograma: 6 al 9 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T41): evaluar sincronización crítica y reintentos`.
