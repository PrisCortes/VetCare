# T36 — Crear copias de seguridad

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Omar de la Cruz Juárez (OD) |
| Fechas previstas | 20 al 29 de octubre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Snapshots locales por consulta y copias independientes verificables implementados; restauración controlada corresponde a T37 |

## Resultado

Cada consulta creada o corregida sin conexión crea un **snapshot lógico cifrado** dentro de la misma transacción SQLite que guarda la consulta, su revisión y su operación pendiente. Contiene exclusivamente el contexto recuperable: propietario, paciente, consulta, revisiones locales de la consulta e identidad de operación. No contiene contraseña, sesión, permiso firmado, clave privada ni configuración del proveedor.

Después del commit, Electron materializa una copia independiente, también cifrada, en el directorio privado de la cuenta. Escribe primero un archivo temporal de nombre irrepetible, lo vacía a disco, lo lee y descifra para comparar la huella SHA-256; solo entonces publica el archivo final. No sustituye un snapshot anterior.

Los estados son:

- `logical_confirmed`: el snapshot forma parte del commit clínico local.
- `copy_pending`: no se pudo generar o comprobar la copia; conserva el snapshot lógico y se reintentará en el siguiente guardado.
- `copy_verified`: existe una copia independiente cifrada y su contenido coincide con la huella lógica.

La banda offline muestra si la copia de la última consulta se verificó o quedó pendiente. Un error al copiar no borra la consulta ni la operación de sincronización, y nunca se informa como si hubiera protección completa.

## Alcance y límites

T36 no restaura datos, no borra snapshots automáticamente, no hace una copia integral de MariaDB y no promete protección ante la pérdida total del equipo: las dos representaciones viven en el dispositivo. La restauración comparada y autorizada corresponde a T37; la copia central y su retención requieren configuración y evidencia separadas del proveedor.

Los archivos de snapshots permanecen fuera de Git junto con el almacenamiento local. No abras, copies ni compartas esos archivos: contienen información clínica cifrada para la misma cuenta y equipo.

## Cómo comprobar esta fase

Desde la raíz del proyecto:

```powershell
npm run test:offline
npm test
npm run check
npm run build
```

La prueba específica T36 crea una consulta ficticia, verifica el snapshot lógico y la copia cifrada, altera deliberadamente esta última, confirma que pasa a `copy_pending` y comprueba que se regenera sin duplicar la consulta ni la cola.

Para una prueba manual en Electron:

1. Ejecuta `npm run dev:desktop`, prepara el acceso offline y entra mediante **Acceso sin conexión**.
2. Crea un propietario, paciente y una consulta ficticios.
3. El aviso offline debe mostrar **“Copia de recuperación verificada”** además del número de pendientes.
4. Cierra la aplicación, vuelve a abrirla y desbloquea la misma cuenta. Los datos y la cola deben continuar disponibles.

No elimines ni alteres manualmente archivos dentro de los datos de la aplicación durante una prueba normal. La detección de una copia alterada se cubre automáticamente sin usar datos clínicos reales.

## Responsable, fechas y commit

- Responsable: Omar de la Cruz Juárez (OD).
- Ventana del cronograma: 20 al 29 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T36): crear snapshots cifrados verificables`.
