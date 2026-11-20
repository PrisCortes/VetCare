# T47 — Comprobar guardado y recuperación en pruebas

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Oscar Aarón Delgadillo Fernández (OD) |
| Fechas previstas | 17 al 20 de noviembre de 2026 |
| Ejecución automatizada | 21 de noviembre de 2026 |
| Estado | Recuperación lógica conforme; comprobación nativa Windows/Electron pendiente de terminal interactiva |

## Evidencia ejecutada

```powershell
npm run test:offline
```

Resultado: **11 pruebas aprobadas**. La suite comprueba, con datos temporales y cifrados:

| Escenario | Resultado |
| --- | --- |
| Guardado local de propietario, paciente y consulta | Conforme; SQLite persiste, cifra y reabre los datos |
| Snapshot por consulta | Conforme; copia independiente verificada y regeneración tras alteración detectada |
| Restauración aislada | Conforme; crea una nueva revisión y conserva el historial anterior |
| Interrupción durante envío | Conforme; una operación `sending` reaparece como `retry` sin borrarse |
| Aislamiento, inactividad y vencimiento | Conforme; otra cuenta no accede a la cola y el vencimiento no borra pendientes |
| Confirmación de sincronización | Conforme; solo elimina el pendiente tras respuesta durable del servidor |

La prueba portable no simula corte físico de energía, pérdida total del dispositivo ni recuperación integral de MariaDB. Tampoco sustituye la protección nativa de Windows.

## Comprobación Windows pendiente

`npm run test:offline:windows` no terminó dentro de la sesión automatizada. Ejecuta el siguiente comando desde la terminal interactiva de Windows, con Electron instalado y sin otra instancia de la prueba abierta:

```powershell
npm run test:offline:windows
```

Registra únicamente si finaliza correctamente o su error sanitizado. No copies claves, rutas de perfiles, archivos de snapshot, cookies ni datos clínicos.

## Recorrido manual complementario

Con una cuenta y datos ficticios:

1. Ejecuta `npm run dev:desktop`, prepara acceso offline y crea propietario, paciente y consulta.
2. Confirma que se muestran pendientes y una copia de recuperación verificada.
3. Cierra Electron normalmente, abre de nuevo sin red y desbloquea la misma cuenta: datos, cola y copia deben continuar disponibles.
4. Si hay una consulta sincronizada, corrígela offline, confirma la corrección y usa **Restaurar consulta** sobre una copia anterior. Debe crear una revisión nueva, no borrar ninguna previa.
5. Conserva el resultado en un registro privado; no alteres ni compartas los archivos de recuperación.

Un fallo de copia, restauración o persistencia se registra como defecto bloqueante para T48. La recuperación de un servidor completo requiere un entorno aislado y no se declara demostrada por este recorrido.

## Responsable, fechas y commit

- Responsable: Oscar Aarón Delgadillo Fernández (OD).
- Ventana del cronograma: 17 al 20 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `test(T47): verificar guardado y recuperación offline`.
