# T38 — Unir módulos del sistema

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Diego Alonso Coronel Vargas (DA) |
| Fechas previstas | 26 de octubre al 4 de noviembre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Integración local de web, API PHP y Electron comprobada; publicación HTTPS y recorrido central real permanecen pendientes |

## Resultado

T38 consolida las fronteras entre los módulos ya implementados:

- La interfaz web llama únicamente a `/api/v1` del mismo origen.
- Electron mantiene la cookie, CSRF, autorización offline, SQLite y copias de recuperación en el proceso principal; la vista recibe solo el puente limitado de `preload.cjs`.
- `npm run dev:desktop` inicia la web y API locales para desarrollo. `npm run desktop:central` requiere un origen HTTPS publicado y no entrega variables `DB_*` ni `OFFLINE_PRIVATE_KEY` al proceso de Electron.
- La pantalla **Estado del entorno** identifica el canal actual —desarrollo local u origen HTTPS central— y comprueba la API sin enviar información clínica.
- Las etiquetas visibles se actualizan a T38 para no presentar las pantallas como el prototipo aislado de T17.

No se declara publicado el servicio central: todavía falta configurar un origen HTTPS real, sus secretos de backend y ejecutar el recorrido conectado desde Electron. Esta fase tampoco incorpora recepción incremental de otros equipos ni recuperación completa de una instalación.

## Cómo comprobar esta fase

Con Electron cerrado, desde la raíz:

```powershell
npm test
npm run check
npm run build
npm run test:integration
npm run dev:desktop
```

En Electron, inicia sesión y confirma que puedes navegar entre Pacientes, Propietarios, Expediente y Carnet. Abre **Estado del entorno**, verifica que el cliente indica **Electron · Windows**, el canal indica **Mismo origen de desarrollo** y pulsa **Comprobar API**. El resultado debe decir que la API respondió mediante el mismo origen.

Para el modo distribuido, solo después de publicar un origen HTTPS real:

```powershell
$env:VETCARE_APP_URL = 'https://tu-origen-central.example'
npm run desktop:central
```

No uses la dirección de ejemplo como una URL real. El indicador debe cambiar a **Origen HTTPS central**. La validación del inicio de sesión central y de MariaDB pertenece al entorno publicado, no se acredita por la prueba local.

## Responsable, fechas y commit

- Responsable: Diego Alonso Coronel Vargas (DA).
- Ventana del cronograma: 26 de octubre al 4 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T38): integrar escritorio, web y API`.
