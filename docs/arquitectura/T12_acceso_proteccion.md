# T12 — Definir los niveles de acceso y protección de la información

## Identificación

| Dato | Valor |
| --- | --- |
| Fase | 3.0 — Diseño de arquitectura e interfaz |
| Responsable documental | Priscila Cortés Ramírez (PC) |
| Inicio previsto | 15 de septiembre de 2026 |
| Fin previsto | 18 de septiembre de 2026 |
| Preparación del diseño | 18 de noviembre de 2026 |
| Estado | Política técnica propuesta; implementación en tareas posteriores y revisión conjunta T14 |

Las fechas previstas se conservan del cronograma. Este archivo no crea cuentas, claves, permisos o controles efectivos. El prototipo T10/T11 sigue sin autenticación; no debe tratarse como un sistema protegido.

## Objetivo, fuentes y decisiones

Especificar RE12 y M13/ES-12 para web y escritorio, protegiendo integridad y autoría en sincronización y recuperación. Fuentes: alcance, plan de recursos, plan de calidad, riesgos R1/R3/R11 y los diseños [T5](../gestion/T05_funciones_condiciones.md), [T8](T08_arquitectura_sistema.md) y [T9](T09_modelo_datos.md).

Los roles administrador y veterinario fueron acordados por el usuario. La matriz, tiempos y mecanismos que se detallan son decisiones técnicas propuestas de T12, no aprobaciones clínicas ni controles implementados. No se solicita decidir ahora cada parámetro técnico; son configuraciones revisables con evidencia antes de la puesta en uso.

## Identidad y alcance de acceso

La aplicación sirve a una clínica. Se propone que ambos roles tengan acceso clínico dentro de ella y que el administrador tenga además funciones de cuentas y dispositivos. No existe aislamiento de historiales por médico: los dos médicos deben poder consultar la continuidad de atención. Incorporar otra clínica requeriría diseñar un límite de organización explícito antes de reutilizar este modelo.

No hay autorregistro, cuentas de propietarios ni rol permanente de evaluador. Los integrantes DA/PC/OD/BG y los nombres de los médicos no se convierten automáticamente en cuentas ni permisos. La persona que recibirá la cuenta administradora sigue por designar.

## Matriz de permisos propuesta

Sí: acción permitida al rol autenticado, sujeta a reglas de integridad. No: denegada en API, IPC y controles locales, aunque alguien manipule la interfaz.

| Operación | Administrador | Veterinario | Condiciones |
| --- | --- | --- | --- |
| Consultar propietarios y pacientes | Sí | Sí | Incluye historial autorizado; no lectura anónima |
| Crear/actualizar propietarios y pacientes | Sí | Sí | Guardado trazable y referencias válidas |
| Dar de baja/reactivar paciente | Sí | Sí | Baja lógica; conservar historial |
| Dar de baja propietario | Sí | Sí | Bloquear si tiene pacientes activos; no cascada silenciosa |
| Crear consultas, seguimientos y eventos sanitarios | Sí | Sí | Paciente activo y campos válidos |
| Corregir eventos clínicos | Sí | Sí | Conservar revisión anterior y registrar autor de la corrección |
| Borrar físicamente historia clínica o versiones | No | No | No exponer endpoint, IPC o botón de eliminación irreversible |
| Consultar versiones y conflictos clínicos | Sí | Sí | Dentro de los datos autorizados |
| Resolver conflicto | Sí | Sí | Conservar ambas versiones y crear resolución trazable |
| Capturar/consultar offline en escritorio | Sí | Sí | Autorización local vigente y desbloqueo; sin acceso web offline |
| Enviar y recibir cambios | Sí | Sí | Identidad y permiso vigentes revalidados en servidor |
| Crear cuentas o cambiar roles/estado | Sí | No | Solo conectado; reautenticación reciente; no desactivar al último administrador activo |
| Revocar sesiones/dispositivos de otras cuentas | Sí | No | Solo conectado y con auditoría |
| Cerrar sesión propia y retirar autorización local propia | Sí | Sí | No eliminar pendientes clínicos al cerrar |
| Crear/consultar snapshots locales propios de la instalación | Sí | Sí | Entorno local autorizado, sin datos de otras identidades no autorizadas |
| Restaurar snapshot local | Sí | Sí | Desbloqueo reciente, previsualización y confirmación; no sobrescritura silenciosa |
| Alterar secretos de servidor desde la aplicación | No | No | Administración técnica fuera de UI clínica |
| Ver auditoría de cuentas y accesos | Sí | No | Eventos técnicos sanitizados, no tokens ni contraseñas |

La capacidad de corregir no permite reasignar una consulta a otro paciente como edición ordinaria. Una eventual rectificación de identidad requiere un procedimiento explícito antes de implementarla. No se interpreta baja de paciente como permiso para borrar su historial o sus versiones.

Las acciones administrativas no existen offline. Los perfiles locales no se pueden editar para convertirse en administrador; la autorización se obtiene del servidor y se valida en la frontera privilegiada.

## Web: autenticación y sesión

1. Usuario y contraseña se envían por HTTPS; la respuesta de credenciales inválidas es genérica para no revelar si existe la cuenta.
2. El backend compara contra un hash de contraseña con función adaptativa adecuada disponible en PHP; nunca guarda o registra la contraseña en claro. El algoritmo, coste y actualización de hashes se verifican en el entorno real de T19.
3. Tras autenticar, crear una sesión con identificador opaco aleatorio, registrar su verificador/hash central y emitir cookie Secure, HttpOnly, SameSite y Path restringidos al origen previsto. Rotar al iniciar sesión y al cambiar privilegios.
4. Cada solicitud comprueba sesión, estado de usuario y permiso de la operación sobre el recurso. No aceptar un rol o usuario enviado por el cliente como autoridad.
5. Propuesta de vigencia: 30 minutos de inactividad y 12 horas de duración absoluta. Comprobar ambos límites en servidor; el sondeo automático no debe renovar indefinidamente una sesión sin interacción.
6. Cambios por cookie requieren protección CSRF con token y validación de origen; SameSite no se trata como único control. No efectuar modificaciones mediante GET.
7. Cerrar sesión invalida el registro central y la cookie. Revocar cuenta, cambiar contraseña o reducir permisos invalida las sesiones afectadas.

Vercel no proporciona persistencia de sesiones por guardar archivos PHP en disco temporal. El estado revocable se almacena en MariaDB; las variables de proceso y el sistema de archivos temporal no son fuentes de autoridad. No guardar tokens de sesión en localStorage ni en URL.

Estas decisiones toman como referencia la gestión de sesiones de OWASP; los tiempos concretos son una propuesta propia del proyecto, no valores obligatorios atribuidos a esa fuente.

## Escritorio: sesión conectada

El proceso principal de Electron, no el renderizador, realiza el intercambio de autenticación con la API. Se proponen tokens opacos revocables específicos de escritorio: acceso de 15 minutos y renovación de hasta 7 días, con rotación de la renovación y detección de reutilización. Los verificadores se almacenan en servidor; el secreto local se protege mediante almacenamiento del sistema operativo, usando la API soportada por la versión de Electron seleccionada.

Si la protección de secretos del sistema no está disponible, no guardar tokens persistentemente como texto plano: informar el límite y requerir autenticación en línea al volver a iniciar. Los tokens solo se utilizan contra la URL HTTPS autorizada y nunca pasan al JavaScript de las vistas. Un ID de dispositivo por sí solo no autentica.

Un cambio de rol o revocación central se comprueba al renovar y en las operaciones sensibles. En cada recepción/envío el servidor vuelve a verificar el usuario y dispositivo; no acepta una autorización offline como permiso ilimitado de sincronización.

## Autorización y desbloqueo offline propuestos

El objetivo es permitir reiniciar y trabajar en Windows sin red sin replicar la contraseña central ni permitir acceso solo porque exista el archivo SQLite.

| Elemento | Política candidata |
| --- | --- |
| Habilitación | Iniciar sesión en línea, autorizar el dispositivo y habilitar explícitamente acceso sin conexión para esa cuenta |
| Permiso offline | Documento firmado por el servidor con usuario, dispositivo, permisos clínicos, versión de política, emisión y expiración |
| Duración máxima | 72 horas desde la emisión/renovación confirmada; configurable en revisión de diseño |
| Verificación local | Firma mediante clave pública incorporada al cliente y enlace con cuenta/dispositivo; sin clave privada de firma en el instalador |
| Desbloqueo tras reinicio o inactividad | Clave local elegida al habilitar offline; verificador con sal y derivación resistente a fuerza bruta, separado del hash central |
| Bloqueo de pantalla | 15 minutos sin interacción; volver a desbloquear sin exigir red mientras la autorización siga vigente |
| Intentos fallidos | Espera progresiva y límite persistente por instalación; no destruir datos ni bloquear irreversiblemente al usuario |
| Al expirar | Bloquear nuevas consultas/ediciones y visualización clínica hasta renovar autorización; conservar datos y cola íntegros |
| Revocación conocida | Invalidar autorización local al recibir la revocación y bloquear acceso clínico; no borrar registros pendientes |

La clave local no es la contraseña del servidor; no sirve para API ni para cambiar roles. La habilitación requiere verificar que se puede proteger el material local asociado mediante el usuario de Windows. No se inventa una clave predeterminada o PIN compartido.

El permiso firmado debe ligar al menos el identificador del usuario Windows/instalación y la cuenta; aun así no protege frente a un atacante con control total del sistema operativo. La política local no sustituye cifrado del disco, bloqueo de Windows o seguridad física. SQLite no está cifrado automáticamente por aplicar una pantalla de bloqueo.

### Reloj y límite de revocación

Guardar la referencia de hora central y último instante observado; detectar retrocesos significativos y exigir renovación cuando no se pueda comprobar vigencia de forma fiable. El reinicio no debe ampliar la autorización. No es posible garantizar expiración inviolable frente a un atacante con control de archivos y reloj del equipo.

Una revocación remota no puede conocerse inmediatamente sin red. La exposición aceptada en esta propuesta dura como máximo hasta la expiración verificable del permiso, salvo compromiso del equipo. Esta limitación debe comunicarse antes de habilitar uso real; no se presenta como revocación instantánea.

### Datos de varias cuentas en un equipo

Propuesta: almacén local y cola separados por cuenta y clínica, vinculados al usuario Windows. Al cambiar de cuenta no mostrar datos ni pendientes del usuario anterior. No compartir archivo clínico sin un diseño de separación equivalente y pruebas de acceso cruzado. La réplica inicial solo descarga datos dentro del ámbito permitido; no hay contraseña/hash central ni sesiones web en esa copia.

## Desconexión, rechazo y conservación

| Situación | Respuesta exigida |
| --- | --- |
| Expira sesión web durante un formulario | Conservar temporalmente captura en memoria mientras la página siga abierta, solicitar acceso y no confirmar guardado inexistente; no almacenar texto clínico automáticamente en almacenamiento del navegador |
| Cierre de sesión de escritorio con pendientes | Informar cantidad y conservar cola; cerrar no significa borrar registros ni enviarlos con otra identidad |
| Revocación o cuenta inactiva al reconectar | Rechazar envío/recepción; conservar pendientes bloqueados para tratamiento autorizado |
| Usuario distinto intenta sincronizar cola ajena | Denegar; no cambiar autoría ni aplicar sus tokens a operaciones del otro usuario |
| Permiso insuficiente sobre un evento | Rechazo por operación sin filtrar datos del recurso; no reintentar como fallo transitorio de red |
| Error de red tras commit central | Reintentar identidad de operación; no duplicar evento ni perder revisión local |
| Restauración local | Nueva revisión y operación autorizada, conservando fuente; no reponer una autorización antigua o sesión revocada desde el snapshot |

Una eventual recuperación por administrador de registros bloqueados requiere un procedimiento específico con evidencia y conservación de autoría. No se proporciona una puerta trasera ni se reetiquetan automáticamente operaciones de una cuenta revocada.

## Controles de servidor, Electron y datos

- Denegación por defecto y comprobación por operación, recurso y canal. Aplicar las mismas reglas a consultas directas, listados, sincronización, versiones y conflictos.
- Consultas parametrizadas; listas permitidas de campos, tipos de entidad y ordenamiento; no aceptar nombre de tabla o SQL enviado por el cliente.
- Límite candidato: cinco fallos de acceso por cuenta/ventana de 15 minutos, con espera progresiva y control adicional por origen. Persistir contadores en central; no depender de memoria de una función. Verificar que la limitación no permita denegación permanente a terceros.
- Operaciones de cuenta, revocación y restauración requieren comprobación reciente de identidad; propuesta de ventana de cinco minutos. Evitar que renueve privilegios una tarea automática.
- HTTPS y validación de certificados; MariaDB con TLS validado. No suprimir advertencias o desactivar validación por problemas de configuración.
- CORS con orígenes explícitos para web; para escritorio usar canal autenticado del proceso principal, sin resolverlo permitiendo cualquier origen con credenciales.
- Context isolation, sandbox, Node deshabilitado en las vistas y puente preload mínimo. Validar argumentos, emisor y permisos de cada IPC. Bloquear navegación/ventanas externas no previstas y definir CSP restrictiva al integrar la aplicación real.
- Secretos de servidor solo en configuración protegida del backend. Ningún hash, token, contraseña o secreto de proveedor en el instalador, las vistas, evidencias o repositorio.
- Los ejemplos clínicos y nombres de demostración siguen ficticios. No se eleva un prototipo sin autenticación a entorno clínico por publicarlo.

La aplicación real debe utilizar una versión de Electron soportada y comprobar las APIs de aislamiento y almacenamiento protegido. El prototipo actual contiene SVG y estilos/interacciones de diseño: no se afirma que ya satisfaga la política CSP o las restricciones del empaquetado final.

## Auditoría mínima propuesta

Registrar en central inicio de sesión exitoso/fallido sanitizado, cierre/revocación, cambios de cuenta/rol, autorización de dispositivo y acciones sensibles. Para datos clínicos, conservar autoría, versiones, operación y dispositivo de T9. En offline, conservar la traza necesaria y sincronizarla con su contexto original, diferenciando hora del dispositivo y recepción central.

Los eventos de seguridad no contienen contraseñas, cookies, tokens, texto clínico completo ni SQL. El historial de versiones clínicas tiene permisos propios y no se mezcla con un log público. La retención de auditoría se concretará con almacenamiento/recuperación; no se afirma un periodo legal ni cumplimiento normativo no evaluado.

## Ajustes al modelo T9 que deberá incorporar la implementación

| Registro | Precisión requerida |
| --- | --- |
| usuarios | Estado y rol; hash central; no eliminar identidad si existe autoría histórica |
| sesiones | Tipo web/escritorio, verificador del secreto, creación, último uso, expiración absoluta y revocación |
| Renovación de escritorio | Familia de tokens, rotación y reutilización; separados del acceso de corta duración |
| dispositivos | Propietario de la autorización, estado y versión de política |
| Autorización offline local | Documento firmado, referencia temporal, clave pública verificadora y verificador de desbloqueo protegido; sin clave privada central |
| Almacén local | Separación por identidad y ámbito; permisos efectivos comprobados en proceso principal |
| Auditoría central | Eventos, actor, resultado y referencia de recurso sin secretos |

Estas precisiones amplían el diseño lógico, no constituyen migraciones ejecutadas. Los secretos y sesiones no se propagan como entidades clínicas editables.

## Casos de verificación de acceso

Se detallan subcasos de ES-12/M13, sin reemplazar el requisito de integridad ni el resto de pruebas.

| ID | Intento o situación | Resultado esperado |
| --- | --- | --- |
| ACC-01 | Acceso sin sesión a paciente, historial, versiones o cambios | Bloqueado sin filtrar información clínica |
| ACC-02 | Veterinario consulta expediente autorizado | Permitido; el sistema conserva autoría de modificaciones |
| ACC-03 | Veterinario llama directamente API de crear usuario/cambiar rol | Denegado aunque modifique la UI |
| ACC-04 | Administrador desactiva al último administrador activo | Rechazado sin dejar el sistema sin administración |
| ACC-05 | Reutilizar sesión cerrada, expirada o revocada | Denegado en servidor |
| ACC-06 | Solicitud de escritura con cookie pero CSRF/origen inválido | Rechazada; sin cambios |
| ACC-07 | Acceso offline sin habilitación, con firma alterada o permiso vencido | Bloqueado; datos existentes conservados |
| ACC-08 | Reiniciar desconectado con permiso vigente y desbloqueo correcto | Acceso clínico local dentro de permisos; servidor no requerido |
| ACC-09 | Volver el reloj atrás o reiniciar para extender vigencia | No ampliar permiso; exigir renovación si no puede validarse |
| ACC-10 | Cambiar de cuenta con pendientes ajenos | Sin exposición o envío con otra identidad |
| ACC-11 | Recibir revocación con pendientes locales | Acceso bloqueado y pendientes conservados; sin envío automático |
| ACC-12 | Manipular campos de rol/usuario/dispositivo en una operación | No concede permisos ni permite falsificar autoría |
| ACC-13 | Inyectar SQL o script mediante campos de captura | No ejecutar SQL arbitrario ni script; rechazar o tratar como texto seguro según el campo |
| ACC-14 | Invocar IPC no permitido o desde emisor no autorizado | Rechazado sin acceso genérico al sistema de archivos o SQL |
| ACC-15 | Restaurar copia antigua con datos de sesión | No revivir permisos o sesiones ni sobrescribir cambios silenciosamente |
| ACC-16 | Renovar con token anterior ya rotado | Detectar reutilización y revocar familia conforme a política |

## Referencias técnicas consultadas

- [OWASP — Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): cookies protegidas, expiración y revocación en servidor.
- [Electron — Security](https://www.electronjs.org/docs/latest/tutorial/security): aislamiento, sandbox, contenido y fronteras privilegiadas.
- [Electron — Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation): exponer un puente mínimo no sustituye validar cada operación.

Consulta técnica realizada durante la preparación actual. Los parámetros de duración, obligatoriedad y distribución de permisos de esta tarea son propuestas de VetCare y deben verificarse en su implementación; no se atribuyen a las fuentes como valores obligatorios.

## Cierre y siguiente tarea

- [x] Definir roles y matriz de permisos sin crear usuarios reales.
- [x] Diseñar sesión web y de escritorio, revocación y límites de autorización offline.
- [x] Definir protección de secretos, IPC, consultas y conservación de pendientes.
- [x] Relacionar controles con ES-12/M13 y casos ejecutables futuros.
- [x] Mantener responsable, fechas y distinción entre política e implementación.
- [ ] Implementar y ejecutar casos en T19 y tareas de integración/pruebas.

Resultado: diseño T12 preparado para revisión T14. No se declara cumplimiento de M13 hasta ejecutar los escenarios y registrar sus resultados.

Siguiente tarea: T13 — Planear el guardado y la recuperación de información; responsable Priscila Cortés Ramírez; ventana documental del 16 al 21 de septiembre de 2026.
