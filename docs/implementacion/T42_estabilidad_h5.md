# T42 — Confirmar estabilidad, H5

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Diego Alonso Coronel Vargas (DA) |
| Fecha prevista | 9 de noviembre de 2026 |
| Revisión | 21 de noviembre de 2026 |
| Decisión | H5 no aprobado; versión no congelada |

## Resultado de la puerta H5

T42 revisa la condición de congelar una versión, no agrega una función clínica. La evidencia local es consistente, pero no satisface todas las condiciones exigidas por H5. Por tanto, no se etiqueta una versión, no se declara "estable" ni se convierte la versión de desarrollo en entrega final.

| Condición obligatoria | Estado | Evidencia / decisión |
| --- | --- | --- |
| Núcleo obligatorio conforme | Conforme automatizado | `npm test`: 61/61 pruebas aprobadas el 21 de noviembre de 2026 |
| Guardado offline y recuperación | Conforme automatizado | T36/T37: snapshot cifrado, verificación de alteración y restauración como nueva revisión cubiertos por `tests/offline.test.mjs` |
| Sincronización durable, UUID y reintento | Conforme automatizado | Cola y cliente simulados cubiertos por T31/T34/T41; no sustituye infraestructura externa |
| M05b: lote de intercambio contra MariaDB temporal | Conforme | T41-DB-02 aprobó `npm run test:sync:database`: UUID, reintentos, conflicto y bloqueo en tablas temporales |
| M05b: intercambio crítico contra staging | Pendiente | Falta ejecutar el mismo intercambio a través de la API HTTPS publicada, no solo mediante MariaDB temporal |
| M05b: origen HTTPS de staging | Pendiente | No existe `VETCARE_APP_URL` configurado para una API central publicada de staging |
| M05b: reconexión física | Pendiente | Debe observarse en Electron con datos ficticios, contador, UUID y verificación de no duplicados |
| Identificador inmutable de entrega | Pendiente | No se congela un árbol con cambios sin commit; el usuario debe confirmar el commit y su hash después de que M05b sea conforme |

## Corte técnico disponible

La base de referencia consultada es `b3a03ac`. Este valor identifica el último commit visible, pero **no es una versión congelada de H5**: la congelación solo puede ocurrir después de incorporar los cambios revisados, ejecutar el lote M05b y registrar un hash de commit limpio.

Los cambios posteriores a H5, si se aprueba, se limitan a correcciones. Mientras H5 siga pendiente, T43 y otras tareas de prueba pueden preparar evidencia sin presentar la puerta como aprobada.

## Qué falta para decidir H5

1. Publicar/configurar el origen HTTPS de staging en `VETCARE_APP_URL`, usando solo cuenta y datos ficticios.
2. Ejecutar el intercambio crítico a través de esa API publicada y conservar evidencia antes/después por UUID.
3. Ejecutar T41-RC-01 desde Electron: desconexión, reintento, recuperación de red, contador final en cero y ausencia de duplicados por UUID.
4. Repetir `npm test`, `npm run check` y `npm run build` desde el equipo de entrega.
5. Cuando todos los puntos estén conformes, crear el commit elegido por el usuario y registrar su hash como candidato congelado.

## Cómo revisar esta fase

```powershell
npm test
npm run check
npm run build
npm run db:diagnose
npm run test:sync:database
```

Los primeros tres comandos revisan la regresión local. Los dos últimos, junto con el recorrido T41-RC-01, son la evidencia que sigue faltando para la decisión H5; una salida local exitosa no reemplaza el recorrido físico.

## Responsable, fecha y commit

- Responsable: Diego Alonso Coronel Vargas (DA).
- Fecha del cronograma: 9 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario **solo cuando H5 sea conforme**: `chore(T42): congelar candidato H5 verificado`.
