# T35 — Prevenir conflictos de modificación

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Priscila Cortés Ramírez (PC) |
| Fechas previstas | 26 de octubre al 3 de noviembre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Política LWW central, conservación de ambas ramas y prueba automatizada; falta la prueba real en MariaDB del entorno central |

## Resultado

T35 resuelve únicamente conflictos de actualizaciones offline de propietarios, pacientes y consultas. Una actualización conectada con una versión antigua sigue devolviendo conflicto: no sustituye un formulario que otra persona está editando en pantalla.

Al llegar una operación offline cuya `baseVersion` ya no es la visible, el servidor bloquea la entidad, conserva la versión visible desplazada y aplica la candidata como la nueva versión visible. La política se denomina `server_commit_order_lww_v1`:

1. La revisión base detecta que existió concurrencia.
2. El bloqueo de fila fija un único orden de confirmación central.
3. La última operación que confirma en ese orden es la visible (LWW); no se toma la hora del dispositivo, la fecha clínica ni un UUID como criterio.
4. Las dos cargas completas y las versiones base, desplazada y ganadora quedan en `vc_sync_conflicts` y en las tablas de versiones existentes.

Esto impide que la cola quede bloqueada indefinidamente y, a la vez, evita borrar el contenido que dejó de ser visible. La resolución manual y la vista clínica de conflictos corresponden a una fase posterior: el registro persistente ya permite construirlas sin perder evidencia.

## Esquema y seguridad de despliegue

`database/mariadb/006_conflicts.sql` crea la tabla central de conflictos. `npm run db:migrate` incorpora la migración sin modificar las cinco anteriores.

La distribución de Electron ya no usa PHP local ni variables `DB_*`: `npm run desktop:central` exige `VETCARE_APP_URL` con el origen HTTPS publicado. El proceso de Electron elimina `DB_*` y `OFFLINE_PRIVATE_KEY` de su entorno. Solo el entorno secreto del servicio central contiene la conexión MariaDB y la clave de firma offline. `npm run dev:desktop` conserva el servidor local exclusivamente para desarrollo.

El archivo `.env.example` ya no incluye una contraseña. Si la contraseña que antes aparecía allí llegó a un repositorio compartido, historial, copia o captura, debe cambiarse de inmediato en AlwaysData y actualizarse únicamente en los secretos del servicio central y en el `.env` privado de desarrollo.

## Cómo comprobar esta fase

Primero, desde un equipo administrativo que pueda conectar con MariaDB y tenga el host temporal configurado solo si sigue siendo necesario:

```powershell
npm run db:check
npm run db:migrate
npm run test:sync:database
npm test
npm run check
npm run build
```

`db:migrate` solo crea estructuras de aplicación que falten; no borra expedientes. Confirma que muestra `Migración preparada: 006_conflicts`. La prueba `test:sync:database` usa tablas temporales, crea dos actualizaciones desde la versión 1 y comprueba que:

- la versión visible termina en 3;
- `vc_sync_conflicts` contiene la base 1, la desplazada 2 y la ganadora 3;
- las dos cargas conservan sus textos completos;
- reintentar la misma operación no duplica la entidad ni el conflicto.

Para comprobar la ruta distribuida, primero publica el mismo origen HTTPS que sirve la web y la API; después, en un equipo que no tenga `.env` con secretos:

```powershell
$env:VETCARE_APP_URL = 'https://tu-origen-central.example'
npm run desktop:central
```

Debe abrir la aplicación y comunicarse solamente con el servicio HTTPS. No debe requerir una entrada en `hosts`, PHP local ni datos de MariaDB en ese equipo. No declares lista la distribución hasta que exista ese origen publicado y se pruebe el inicio de sesión real.

## Responsable, fechas y commit

- Responsable: Priscila Cortés Ramírez (PC).
- Ventana del cronograma: 26 de octubre al 3 de noviembre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T35): resolver y conservar conflictos de sincronización`.
