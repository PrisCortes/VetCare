# T25 - Registro sin internet, H3

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Priscila Cortés Ramírez (PC), por asignación del usuario |
| Fechas previstas | 9 al 16 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Código offline integrado y pruebas portables aprobadas; Windows/Electron y recorrido central pendientes |

## Resultado ejecutable

Electron permite preparar una cuenta con conexión y después desbloquearla sin internet mediante una clave local distinta de la contraseña central. En modo local se pueden registrar/editar propietarios y pacientes, registrar/corregir consultas y consultar el historial disponible. Cada guardado conserva entidad, revisión y operación pendiente en una sola transacción SQLite. La interfaz diferencia guardado en este equipo de guardado en MariaDB.

No hay envío automático en T25. La organización completa de pendientes y el intercambio corresponden a T32/T34/T35. Volver a iniciar sesión en línea no sube cambios ni los elimina. Los datos locales y centrales pueden diferir mientras existan pendientes; esta entrega no declara sincronización terminada.

## Preparar y comprobar en Windows

Cerrar Electron y detener el servidor anterior. Desde la raíz del proyecto:

```powershell
npm run offline:keys
npm run test:offline
npm run test:offline:windows
npm run dev:desktop
```

1. `offline:keys` genera una pareja RSA de 2048 bits si no existe. Guarda la privada en storage/server-keys/offline-private.pem, la pública en config/offline-public.pem y configura únicamente OFFLINE_PRIVATE_KEY en `.env`, sin imprimir o modificar las credenciales MariaDB. No rota claves existentes ni reemplaza una pareja que no coincida. Si existe la pública y se perdió la privada, exige restaurar la privada original.
2. La prueba portable utiliza datos ficticios y protectores simulados del sistema operativo para los tests de bóveda; no acredita DPAPI real. La prueba Windows ejecuta Electron sin ventana clínica y comprueba su API asíncrona de cifrado/descifrado. Si esta última falla, compartir su salida y no dar por comprobada la protección nativa.
3. Iniciar sesión en Electron con internet. Pulsar Preparar sin conexión dentro de los primeros cinco minutos del login. Elegir y repetir una clave local (12–128 bytes) distinta de la contraseña central. Esperar confirmación de preparación.
4. La preparación descarga propietarios, pacientes y consultas actuales, con nombres de autores. Limita cada entidad a 2000 registros y el texto clínico acumulado de consultas a 8 MiB; si se supera, falla explícitamente en lugar de entregar una réplica incompleta. No descarga todas las versiones históricas centrales, solo la versión actual de cada consulta.
5. Cerrar sesión. Desactivar Wi-Fi/desconectar internet, manteniendo la aplicación abierta. En el acceso, pulsar Acceso sin conexión, seleccionar la cuenta preparada y escribir su clave local.
6. Verificar el aviso Sin conexión y el contador de operaciones pendientes. Crear un propietario ficticio, un paciente vinculado y una consulta. Debe confirmarse guardado en este equipo y aumentar el contador; no debe afirmarse que se guardó en MariaDB.
7. Cerrar Electron. Aún sin internet, ejecutar nuevamente `npm run dev:desktop`. Los servidores de desarrollo son locales y no necesitan MariaDB para abrir la interfaz. Pulsar Acceso sin conexión y desbloquear la misma cuenta: deben conservarse los registros y pendientes.
8. Entrar en otra cuenta previamente preparada y comprobar que no ve los registros/pendientes de la anterior. La administración de usuarios no se habilita offline.
9. Reconectar internet y cerrar sesión local. Iniciar sesión en línea: los registros locales siguen pendientes, no aparecen automáticamente en central. No recrearlos manualmente como si se hubieran perdido. Preparar de nuevo con pendientes renueva la autorización, pero conserva la base y cola locales, sin sobrescribirlas con una descarga central nueva.

Los comandos web y escritorio deben usar el mismo origen configurado al preparar la cuenta (en desarrollo http://127.0.0.1:5173). Cambiar origen, clave pública o usuario Windows invalida la comprobación correspondiente. No cambiar el reloj a mano para extender acceso: se bloquea y requiere renovación con conexión.

## Autorización y claves

POST /api/v1/offline/bootstrap exige sesión central, permisos clínicos, autenticación reciente, origen y CSRF. Emite un permiso RSA-SHA256 con usuario, dispositivo, origen, permisos clínicos, emisión y vencimiento máximo de 72 horas. La clave pública local está fijada en configuración; no se descarga y confía automáticamente en una clave enviada por el servidor. La firma se verifica antes de desbloquear y en cada acción local.

El permiso no concede administración, acceso central ni una renovación ilimitada. Una revocación central no puede conocerse sin red: el acceso previamente autorizado permanece limitado por su vigencia. El envío futuro deberá revalidar cuenta, permisos y dispositivo; el permiso offline nunca sustituye autenticación central para sincronizar.

La bóveda protegida por safeStorage de Electron guarda las claves de datos y el verificador local derivado con scrypt. Su contenido protegido se almacena como BLOB en una transacción SQLite con synchronous FULL; no se conserva una copia en claro. Si el protector del sistema operativo no está disponible, no hay fallback a claves en texto plano. El proceso principal conserva la autoridad y valida el origen de cada IPC.

Los registros clínicos, resultados y cargas pendientes se cifran con AES-256-GCM, IV aleatorio y contexto de cuenta/tipo/ID. Los índices e identificadores técnicos de SQLite no están cifrados: se cifra el contenido de registros, no el archivo entero mediante SQLCipher. La clave queda protegida mediante el usuario Windows; la clave local controla el desbloqueo de la aplicación y no protege frente a control total del sistema operativo.

Cinco claves locales incorrectas generan espera persistente de cinco minutos. La sesión se bloquea por inactividad de 15 minutos, con actividad validada por el proceso principal y temporizador de pantalla. Las consultas automáticas de estado no renuevan actividad. Se conservan referencias temporales protegidas para detectar retrocesos significativos del reloj; no se garantiza invulnerabilidad ante manipulación del equipo por su propietario o un atacante con control del sistema.

## Datos y operaciones

El directorio offline-v1 dentro de userData de Electron conserva una bóveda y una base por cuenta/origen, con rutas derivadas de una huella, sin nombres personales en los directorios. El almacén técnico T16 permanece separado y no se transforma en base clínica. Cambiar o cerrar cuenta bloquea el almacén activo sin borrar sus registros.

Cada operación contiene operationId, cuenta, entidad, revisión local UUID, revisión previa, versión central base y carga estable, cifrados. El resultado de una operación confirmada localmente puede recuperarse ante reintento sin duplicar. Un fallo de validación o transacción no produce un pendiente parcial ni un aviso de éxito.

Las reglas locales comprueban relación propietario/paciente, estados, versiones, mediciones y fechas. Utilizan el validador de atención compartido y una referencia temporal calibrada al preparar la autorización. No se admite administración de cuentas offline. El historial local incluye el estado descargado y las revisiones creadas en este equipo; se informa que no contiene todo el archivo de versiones centrales.

La sincronización futura debe preservar o mapear los UUID locales y sus referencias: las API centrales actuales asignan IDs al crear. También debe confrontar las versiones centrales base con cambios locales y resolver conflictos. T25 conserva ese contexto sin fingir que el protocolo ya está implementado. No existe todavía una acción para borrar/confirmar manualmente la cola.

## Evidencia y pendientes

Pruebas portables: firma PHP interoperable con Node, falsificación/equipo/origen/vencimiento, contenido cifrado, aislamiento por cuenta, guardado atómico, idempotencia, reapertura de SQLite, renovación sin perder pendientes, bloqueo por inactividad y reloj, y ejecución del controlador offline sin llamadas de red ni administración.

La comprobación Windows/Electron no terminó correctamente desde esta sesión. La preparación contra MariaDB y el recorrido visual sin conexión siguen pendientes en la terminal del usuario. Estos resultados no bastan para cerrar H3 hasta comprobar la reapertura real en Electron y su protección nativa.

La privada permanece excluida de Git y de los recursos web. El instalador futuro debe incluir solo la pública; nunca storage/server-keys o `.env`. La configuración del backend de despliegue tendrá que proporcionar la misma privada protegida, sin incluirla en el instalador.

Referencias: https://www.electronjs.org/docs/latest/api/safe-storage/ y https://nodejs.org/api/crypto.html
