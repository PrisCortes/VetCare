# T21 - Desarrollar pacientes

| Dato | Valor |
| --- | --- |
| Responsable | Priscila Cortés Ramírez (PC) |
| Fechas del cronograma | 2 al 8 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Código integrado; migración central y recorrido real pendientes |

## Funciones

Directorio central con alta, búsqueda, ficha de identificación, edición, baja lógica y reactivación de pacientes multiespecie. Se exige nombre/identificación, especie y propietario existente. La raza es opcional; se admite especie libre con sugerencias, sin limitar el sistema a perros y gatos. No se agregan sexo, fotografía ni microchip fuera del alcance T9.

La edad puede ser desconocida, nacimiento conocido o estimación completa (entero no negativo, días/meses/años y fecha de referencia). No se infiere un nacimiento exacto desde una estimación. Las fechas deben existir y no ser futuras; se valida el calendario en servidor. Al cambiar una estimación por un nacimiento se conserva la versión anterior.

El selector busca propietarios activos por nombre, teléfono o localidad y admite más páginas. Conserva el propietario actual al editar y permite distinguir homónimos por sus datos de contacto. Los nombres de pacientes tampoco son únicos: cada registro tiene un UUID.

La API `/api/v1/patients` admite GET, POST y PATCH. Requiere sesión y permisos clínicos; origen autorizado y CSRF en escrituras. Usuario y autor se obtienen de la sesión. Versiones y operationId funcionan como en T20: rechazo de ediciones obsoletas, reintentos idempotentes y conservación de cambios en transacción. No existe DELETE.

## Integridad entre propietarios y pacientes

La migración 003_patients añade FK a propietario y autor, historial de versiones y resultados de operaciones. Un paciente activo requiere propietario activo. Se impide dar de baja al propietario mientras tenga pacientes activos. Crear/reactivar/reasignar pacientes bloquea primero los propietarios en orden de ID y luego el paciente, coordinándose con la baja de T20. La versión se vuelve a comprobar después del bloqueo para evitar sobrescribir una edición concurrente.

T20 pasa a consultar vc_patients directamente al dar de baja propietarios: es necesario aplicar las tres migraciones antes de usar esta entrega. Las consultas clínicas, seguimientos y carnet todavía no están integrados con estos pacientes; la ficha muestra identificación real sin inventar historial.

## Correcciones de acceso y carga

- El HTML comienza con el formulario de acceso oculto y una pantalla neutra «Verificando acceso». Solo se muestra el formulario si la comprobación termina sin sesión válida. Una prueba mantiene pendiente la respuesta para verificar que no aparece el formulario durante ese intervalo.
- No se renderiza ni se solicita un directorio antes de confirmar identidad; se evita la carga duplicada que antes ocurría al iniciar la página y al recibir la sesión.
- La primera comprobación de sesión o login puede incluir el directorio inicial utilizando la misma conexión MariaDB. La consulta periódica de vigencia no incluye directorios ni renueva actividad.
- Se conserva en memoria una caché de directorios durante 15 segundos, hasta 50 entradas, por identidad y filtro. No utiliza localStorage ni disco. Se vacía al cambiar/cerrar sesión y antes/después de escrituras. Buscar/actualizar y buscar propietario omiten esa caché. Una edición basada en datos anteriores continúa protegida por versión en el servidor.
- Se omiten escrituras repetidas de last_seen dentro del mismo minuto; se siguen comprobando usuario, rol, estado y expiración en cada petición real. La inactividad se mide desde la última marca persistida, por lo que el límite puede adelantarse hasta un minuto; no se amplía el plazo absoluto.
- Se añade Server-Timing con duración de la conexión/configuración de base para distinguir latencia de MariaDB de la interfaz. No expone credenciales. No se declara una reducción de segundos medida: la comparación con la conexión del usuario sigue pendiente.

## Comprobación práctica

Detener el proceso anterior con Ctrl+C y ejecutar en la raíz:

```powershell
npm run db:check
npm run db:migrate
npm run test:patients:database
npm run dev
```

1. Abrir http://127.0.0.1:5173 y recargar con Ctrl+F5. Con sesión válida debe verse únicamente la espera neutra y después el directorio, sin destello del formulario de acceso.
2. Retirar la demostración si está activa. Crear primero un propietario ficticio desde su directorio si hace falta.
3. En Pacientes, abrir Nuevo paciente. Buscar/seleccionar propietario, indicar nombre y especie; probar edad desconocida o estimada. Guardar y recargar para verificar permanencia.
4. Buscar por nombre de propietario o paciente y por especie. Abrir ficha, editar raza o edad y verificar el resultado tras recargar.
5. Intentar dar de baja al propietario con paciente activo: debe rechazarse. Dar de baja al paciente y luego al propietario: debe permitirse. Reactivar al paciente con propietario inactivo: debe rechazarse; reactivar primero al propietario.
6. Abrir la misma ficha en dos pestañas, editar y guardar en una; el guardado de la versión anterior en la segunda debe rechazarse sin sobrescribir el primer cambio. Buscar/actualizar omite la caché para recargar el directorio.
7. Para Electron: cerrar el servidor web anterior y ejecutar `npm run dev:desktop`. El módulo usa la API desde el proceso principal. No hay todavía guardado clínico offline ni sincronización con SQLite.

`test:patients:database` utiliza tablas temporales de su conexión; no crea pacientes reales. Comprueba vínculo, homónimos, conservación de edad anterior, versiones, reintentos, conflictos y bajas coordinadas. Las tablas temporales omiten FK por limitación del motor: la migración física, integridad referencial y concurrencia real entre conexiones requieren comprobación adicional.

## Límites y evidencia

Las pruebas sin conexión cubren validación, fechas, edad, estado inicial de acceso, caché y controles previos. La integración HTTP verifica aislamiento y bloqueo de pacientes sin sesión. La revisión visual y ejecución central quedan pendientes donde no se pueda conectar al proveedor. No hay aprobación clínica ni acreditación de sincronización, expedientes o uso offline.

La muestra de T17 conserva únicamente datos ficticios en memoria. Los datos reales de este módulo no se incorporan a ella.
