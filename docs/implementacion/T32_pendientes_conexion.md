# T32 - Organizar pendientes de conexión

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Priscila Cortés Ramírez (PC) |
| Fechas previstas | 16 al 23 de octubre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Cola durable con estados y recuperación verificada; T34 la consume para el envío idempotente |

## Resultado

La cola offline de T25 ahora conserva, por cada operación, un orden local, estado, número de intentos, último intento, próximo intento y un error sanitizado cuando exista. El contenido clínico de la operación y los mensajes de error permanecen cifrados en SQLite; solo los identificadores y el estado técnico quedan indexados.

Estados disponibles:

- `queued`: listo para un primer envío futuro.
- `sending`: tomado por un intento en curso.
- `retry`: el intento se interrumpió o falló de forma temporal; conserva el mismo `operationId`.
- `blocked`: requiere revisión; nunca se elimina automáticamente.

Al volver a abrir la aplicación, un registro que permaneció en `sending` se convierte atómicamente a `retry`, con una explicación y sin generar otra operación. La interfaz offline conserva el contador y además muestra cuántos pendientes están para reintentar o requieren revisión.

La migración local de esquema `1` (T25) a `2` agrega estas columnas sin borrar entidades, revisiones ni pendientes existentes. Una base de versión desconocida sigue rechazándose para evitar una modificación insegura.

## Límites de esta fase y relación con T34

T32 organiza y conserva los pendientes; no define el contrato HTTP ni interpreta una respuesta central. La implementación posterior de T34 toma las operaciones listas en este orden, conserva el mismo `operationId` al reintentar y llama a la confirmación local únicamente después de una aplicación durable. Esa confirmación actualiza la entidad local y elimina el pendiente correspondiente.

Por tanto, un contador distinto de cero significa que aún falta una confirmación central. No se cambia el estado a confirmado solo por recuperar conectividad o iniciar un intento. T35 añadirá la conciliación de conflictos entre copias y cambios de otros equipos.

## Cómo comprobar esta fase

Desde la raíz del proyecto:

```powershell
npm run test:offline
npm test
npm run check
```

Para comprobar el recorrido de Electron, prepara una cuenta offline como se indica en T25, desconecta la red, registra un propietario, paciente y consulta ficticios, y reinicia Electron sin conectar:

```powershell
npm run dev:desktop
```

Resultados esperados:

1. El aviso muestra «Sin conexión» y el número de operaciones pendientes aumenta con cada guardado local.
2. Tras reiniciar y desbloquear la misma cuenta, el número y los registros continúan presentes.
3. Preparar de nuevo la cuenta con pendientes no los borra ni reemplaza por la descarga central.
4. Antes de ejecutar una sincronización, los pendientes siguen mostrados. El envío y su confirmación se comprueban en T31/T34; no borres manualmente el perfil para "limpiar" la cola.

La prueba automatizada cubre además migración desde el esquema de T25, orden FIFO, recuperación de un envío interrumpido, reintento y bloqueo sin pérdida de datos.

## Evidencia

- `npm run test:offline`: 9 pruebas aprobadas, incluida la confirmación durable de una operación por el cliente de sincronización simulado.
- `npm run check`: sintaxis PHP y JavaScript correcta.
- La regresión completa se ejecuta antes del cierre de la fase.

En la revisión posterior de T32 (21 de noviembre de 2026), `npm run test:offline` confirmó además que una operación en `sending` se recupera como `retry`, conserva sus intentos y no se elimina cuando queda `blocked`. La prueba de envío central corresponde a T31/T34 y no modifica estas garantías locales.

## Responsable, fechas y commit

- Responsable: Priscila Cortés Ramírez (PC).
- Ventana del cronograma: 16 al 23 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T32): organizar cola de pendientes offline`.
