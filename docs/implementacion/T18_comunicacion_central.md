# T18 - Preparar comunicación con sistema central

| Dato | Valor |
| --- | --- |
| Responsable documental | Priscila Cortés Ramírez (PC) |
| Ventana del cronograma | 25 de septiembre al 5 de octubre de 2026 |
| Implementación | 18 de noviembre de 2026 |
| Estado | Conector implementado; conexión real y despliegue pendientes |

## Código ejecutable

`server/database.php` construye una conexión PDO MySQL compatible con MariaDB. Exige una CA legible y verificación del certificado, comprueba que la sesión negoció TLS, utiliza utf8mb4, zona UTC y sentencias preparadas nativas. No permite cargas de archivos locales ni múltiples sentencias en una consulta. La conexión no es persistente y tiene un plazo de conexión de cinco segundos (no equivale a un límite de duración de consultas).

`npm run db:check` carga las variables locales y ejecuta un diagnóstico PHP administrativo: abre la conexión, comprueba TLS y ejecuta SELECT 1. No crea tablas, usuarios ni datos. Solo imprime un estado y código; no imprime excepciones PDO, host ni credenciales. Retorna 0 al tener éxito y 1 ante errores. No hay una ruta HTTP pública para este diagnóstico. El endpoint de salud de PHP conserva su contrato previo y no acredita conexión central; su campo database no debe utilizarse como prueba de MariaDB.

Electron y la web siguen hablando exclusivamente con la API. No se incluyen credenciales en sus archivos. Los módulos clínicos y la sincronización aún no usan esta conexión. T19 corresponde al inicio de sesión y permisos.

## Comprobación práctica

Para probar primero con autoridades públicas de confianza, ejecutar `npm run db:prepare-ca`. Exporta las raíces Mozilla incluidas en Node a `storage/certificates/public-roots.pem` e imprime la línea DB_SSL_CA para `.env`. No descarga ni confía automáticamente en el certificado presentado por MariaDB. Si el proveedor utiliza una autoridad privada o una cadena no incluida, será necesario obtener su CA por un canal oficial; no desactivar la verificación. La generación del archivo no acredita una conexión TLS exitosa. Referencia: https://nodejs.org/api/tls.html#tlsrootcertificates

1. Registrar o abrir la cuenta académica de alwaysdata y crear una base MariaDB vacía y un usuario dedicado con acceso únicamente a esa base. No usar una cuenta administrativa compartida. No cargar información real de pacientes.
2. Obtener del proveedor el host exacto, puerto, nombre completo de base, usuario y certificado CA o cadena de confianza correspondiente. Confirmar que admite conexiones externas con TLS verificable desde el alojamiento de la API. No desactivar la verificación si falla.
3. Si no existe `.env`, copiar `.env.example` como `.env`. Si ya existe, conservar sus valores y añadir los campos DB. Completar DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD. Guardar la CA fuera de web/ y dist/ (por ejemplo en storage/) y poner su ruta absoluta en DB_SSL_CA. No enviar contraseñas por chat ni incluirlas en commits.
4. Ejecutar desde la raíz:

```powershell
npm run db:check
```

Resultado necesario para acreditar conexión:

```json
{"status":"available","code":"DB_OK","tls":true}
```

| Código | Acción |
| --- | --- |
| DB_NOT_CONFIGURED | Completar la configuración local del backend |
| DB_INVALID_CONFIGURATION | Revisar campos, puerto y nombres; no se intentó conectar |
| DB_CA_REQUIRED | Revisar la ruta y acceso al archivo de CA |
| DB_TLS_REQUIRED | El servidor no negoció cifrado; revisar TLS con el proveedor |
| DB_CONNECTION_FAILED | Revisar credenciales, disponibilidad, acceso externo y certificado; el error interno se oculta |

Los nombres de base admitidos son letras, números y guion bajo. Las contraseñas mantienen su contenido literal; el lector local admite comillas exteriores y valores en una sola línea.

## Verificación y pendientes

Pruebas de configuración y saneamiento: `npm run test:central` (incluidas también en `npm test`). La prueba del constructor usa un archivo legible como referencia de ruta, no simula un certificado válido ni acredita TLS real.

El diagnóstico ejecutado en esta sesión devolvió DB_NOT_CONFIGURED. La prueba HTTP local encontró EACCES. No se ha creado una cuenta, base central ni despliegue remoto. Tampoco se ha acreditado todavía aceptación de CA válida, rechazo de certificado inválido en un servidor real o comunicación desde Vercel. Para cerrar T18 hay que obtener DB_OK localmente y repetir la verificación en el alojamiento final, comprobando además que un certificado incorrecto falle. La compatibilidad y disponibilidad de la opción de despliegue PHP preparada en T15 continúan pendientes; este conector no las demuestra.

Referencia de PDO y opciones TLS: https://www.php.net/manual/en/class.pdo-mysql.php
