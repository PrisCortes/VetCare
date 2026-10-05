# T19 - Inicio de sesión y permisos

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Priscila Cortés Ramírez (PC) |
| Fechas previstas | 29 de septiembre al 5 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Código integrado; preparación central y recorrido real pendientes |

## Resultado

Acceso conectado por usuario y contraseña, sesión revocable en MariaDB, cierre de sesión y gestión de cuentas. La web inicia bloqueada mientras comprueba la sesión. Ambos roles tienen permisos clínicos; solo administrador puede listar, crear, activar/desactivar cuentas o cambiar roles. No existe autorregistro ni una cuenta con contraseña predeterminada.

La administración requiere inicio de sesión en los últimos cinco minutos. Los cambios invalidan todas las sesiones de la cuenta afectada; se impide desactivar o degradar al último administrador activo. Los cambios se serializan con un bloqueo MariaDB compartido entre API y consola. Las operaciones registran eventos sanitizados en auditoría, sin contraseñas o tokens. No hay todavía una vista de auditoría ni cambio/recuperación de contraseña; esas ampliaciones requieren su implementación antes de uso clínico real.

## Preparar y comprobar en tu terminal

Desde `C:\Users\prisc\Documents\VetCare`, con el `.env` que ya produjo DB_OK:

```powershell
npm run db:check
npm run db:migrate
npm run test:auth:database
npm run auth:create-admin
npm run dev
```

1. `db:migrate` crea cuatro tablas de acceso y el registro de migraciones. No crea ni cambia tablas clínicas. Puede repetirse; compara la huella de la migración normalizando saltos de línea. DDL en MariaDB no es una transacción atómica: las sentencias son idempotentes para reintentar una interrupción.
2. La prueba de autenticación utiliza tablas temporales exclusivamente en su conexión. No crea usuarios reales ni modifica cuentas existentes. Comprueba login, rol de veterinario, último administrador, revocación y límite de intentos. Requiere permiso para tablas temporales; se ejecuta separada de las pruebas sin conexión.
3. `auth:create-admin` pide usuario, nombre y contraseña dos veces. La contraseña no se muestra y viaja a PHP por entrada estándar, no por argumentos. Requiere 12–72 bytes; para una primera comprobación utiliza al menos 12 caracteres ASCII. La persona administradora la elige el usuario, no el código. Este comando se bloquea una vez que existe cualquier cuenta. Las cuentas siguientes se crean desde **Cuentas**.
4. Abrir http://127.0.0.1:5173 e iniciar sesión con esa cuenta. El nombre y rol deben aparecer arriba. Cargar la muestra para revisar las pantallas; los datos clínicos siguen en memoria.
5. Abrir **Cuentas**, crear un veterinario con datos ficticios y cerrar sesión. Entrar con ese veterinario: no debe aparecer Cuentas y la API debe denegar administración aunque se manipule la interfaz.
6. Volver a entrar como administrador para activar/desactivar o cambiar roles. Intentar desactivar al último administrador debe producir un rechazo. Cerrar sesión, recargar y comprobar que vuelve el acceso.
7. Cerrar el proceso y ejecutar `npm run dev:desktop`. Iniciar sesión de nuevo: la sesión de escritorio actual es efímera y se pierde al cerrar el proceso. No se copian contraseñas a SQLite.

Si el servicio indica que falta el origen autorizado, añadir a `.env`:

```dotenv
APP_ORIGIN=http://127.0.0.1:5173
```

El servidor de desarrollo usa ese valor por defecto si no está definido. Abrir la dirección exacta; `localhost` no equivale a `127.0.0.1`. Para producción se exige el origen HTTPS exacto, sin barra final. No se usan orígenes recibidos del cliente como configuración confiable.

## Contrato y controles

| Ruta | Método | Acceso |
| --- | --- | --- |
| /api/v1/auth/login | POST | Origen autorizado y JSON; límite de intentos persistente |
| /api/v1/auth/session | GET | Sesión vigente; devuelve identidad y CSRF web |
| /api/v1/auth/logout | POST | Sesión, origen y CSRF |
| /api/v1/access | GET | Permiso clínico, devuelve identidad y permisos |
| /api/v1/admin/users | GET | Administrador |
| /api/v1/admin/users | POST, PATCH | Administrador, origen, CSRF y autenticación reciente |

Hash adaptativo Argon2id cuando PHP lo ofrece, con fallback PASSWORD_DEFAULT. Límite de contraseña para evitar truncamiento de bcrypt. Los tokens tienen 32 bytes aleatorios y solo su SHA-256 se guarda centralmente. Cookies web HttpOnly, SameSite Strict y Path /api/v1, Secure en HTTPS; HTTP solo se admite para desarrollo en 127.0.0.1. La sesión expira tras 30 minutos sin operaciones autenticadas o 12 horas desde el login. La consulta periódica de vigencia no prolonga el acceso. El inicio de sesión devuelve un error genérico para cuenta desconocida, contraseña errónea o cuenta inactiva.

Cinco intentos fallidos por cuenta y 30 intentos totales por origen en ventanas de 15 minutos, persistidos en MariaDB. Un éxito reinicia el contador de cuenta. El límite por origen usa REMOTE_ADDR sin confiar en cabeceras arbitrarias: el tratamiento de proxies y direcciones de cliente debe validarse en el despliegue. No se acredita aún la resistencia a intentos distribuidos o carga masiva. Las tablas de límites y auditoría precisan una política de limpieza para uso prolongado.

En Electron, un IPC con lista cerrada de acciones realiza las peticiones desde el proceso principal. Cookie y CSRF permanecen en memoria allí. No se usan localStorage o secretos en URL; el renderizador solo recibe datos públicos de usuario y errores sanitizados. El almacenamiento T16 sigue siendo una prueba técnica preautenticada sin datos clínicos.

## Límites respecto al diseño T12

Esta entrega implementa acceso conectado. El mecanismo actual de Electron reutiliza una sesión efímera central; todavía no implementa los tokens dedicados con renovación de siete días, rotación de familias, almacenamiento protegido del sistema ni permisos offline firmados de T12. No se habilita acceso clínico offline ni se afirma protección de una réplica clínica que todavía no existe.

Al perder la sesión, las vistas se bloquean y la muestra se retira. Las capturas de demostración no se conservan al cambiar de identidad; la recuperación de formularios clínicos durante reautenticación debe integrarse cuando haya guardado clínico real. Todavía no existen endpoints de pacientes, consultas o sincronización que puedan acreditar autoría sobre registros persistidos. Las nuevas rutas deberán llamar los controles de autenticación y permisos, además de validar entidades.

## Evidencia

Las pruebas sin conexión verifican permisos, contraseñas, expiración, CSRF, origen, reautenticación, bloqueo anónimo y privacidad del puente Electron. No sustituyen el recorrido HTTP con MariaDB. En esta sesión la conexión real devolvió DB_CONNECTION_FAILED; no se pudo aplicar la migración ni completar la prueba central. La ejecución DB_OK de T18 reportada por el usuario se mantiene como evidencia separada. Falta completar los comandos y recorrido anteriores desde su terminal, revisar visualmente la pantalla y verificar el despliegue HTTPS.

El indicador `database` de `/api/v1/health` pasa a `not_checked`: la salud de PHP no comprueba MariaDB ni implica que esté sin configurar.

Referencias: https://www.php.net/manual/en/function.password-hash.php y https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
