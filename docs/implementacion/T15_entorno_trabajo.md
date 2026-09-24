# T15 — Preparar las herramientas y espacios de trabajo

## Identificación y alcance

| Dato | Valor |
| --- | --- |
| Fase | 4.0 — Desarrollo core fase 1 |
| Responsable documental | Oscar Aarón Delgadillo Fernández (OD) |
| Inicio previsto | 21 de septiembre de 2026 |
| Fin previsto | 24 de septiembre de 2026 |
| Preparación de esta entrega | 18 de noviembre de 2026 |
| Estado | Código de preparación creado; comprobaciones locales parciales y bloqueos externos documentados |

Se conservan fechas y responsables del cronograma. Esta tarea prepara el arranque de web, PHP y Electron; no entrega todavía almacenamiento clínico, cuentas, sincronización o instalador. No crea commits, cuentas externas ni despliegues.

## Estructura creada

| Ruta | Función |
| --- | --- |
| web/ | Interfaz ejecutable de preparación; recursos sin dependencias externas |
| api/ | Entrada PHP y router local; endpoint GET /api/v1/health |
| server/ | Respuestas y manejo básico de errores fuera del directorio público |
| desktop/ | Arranque Electron con aislamiento, sandbox y puente mínimo |
| scripts/ | Desarrollo, build, diagnóstico y comprobación de sintaxis |
| config/php.ini | Extensiones y configuración PHP exclusivas del proyecto |
| tests/ | Contratos PHP y prueba HTTP de integración separada |
| shared/, database/ | Espacios para contratos y migraciones posteriores, sin bases reales |
| Dockerfile y Caddyfile | Preparación candidata para PHP en el preset Container de Vercel |
| .env.example | Variables locales sin secretos |
| .gitignore / .dockerignore | Excluir dependencias, credenciales, datos locales y material no publicable |

El servidor de desarrollo publica únicamente web/ y reenvía /api/ al proceso PHP. La base del repositorio, docs/, .env y server/ no son directorio público. El build utiliza una lista explícita de archivos web y no copia el repositorio completo.

## Herramientas y versiones

- Node detectado: 24.19.0; npm: 11.17.0.
- PHP seleccionado desde PATH: 8.5.1 en C:/php/php.exe. También existe XAMPP con PHP 8.0, pero no se seleccionó como base del proyecto.
- Electron candidato fijado a 45.3.4 en package.json, según la publicación estable consultada. Su instalación y ejecución siguen pendientes por falta de acceso al registro npm desde este entorno.
- No se añaden frameworks frontend o herramientas de build que requieran más descargas para esta preparación. Web y scripts utilizan módulos nativos de Node; Electron es la dependencia externa prevista.
- No se cambió php.ini global. El lanzador utiliza config/php.ini y configura el directorio de extensiones en Windows según el binario elegido. Se comprobó disponibilidad de pdo_mysql, openssl y mbstring con ese proceso.

Las versiones del cliente y sus dependencias deberán verificarse al instalar. No existe package-lock.json generado en esta entrega porque npm no pudo resolver la dependencia. Tras una instalación exitosa, conservar su lockfile y utilizar npm ci en instalaciones posteriores. No se declara resuelto o reproducible el árbol transitivo por fijar solo la versión de Electron.

## Comandos

Ejecutar desde la raíz del proyecto en una terminal normal de Windows. Las comprobaciones de web/PHP no necesitan instalar paquetes npm.

```powershell
npm run doctor
npm run check
npm test
npm run build
npm run dev
```

Con el servidor funcionando, abrir http://127.0.0.1:5173. La comprobación de API apunta a /api/v1/health mediante el mismo origen. El proceso PHP usa por defecto 127.0.0.1:8787. Ctrl+C cierra los procesos creados por el lanzador. Los puertos se pueden cambiar con WEB_PORT/API_PORT en .env o variables del proceso; no deben ser iguales.

Para Electron, cuando haya acceso al registro y a la descarga de su binario:

```powershell
npm install
npm run dev:desktop
```

El lanzador de escritorio inicia primero web/PHP y abre la ventana solo si responde la API. La pantalla identifica el canal de escritorio mediante un único IPC permitido; no expone Node, SQL, rutas arbitrarias o credenciales al renderizador. No es todavía una aplicación offline: eso corresponde a T16/T25.

Prueba HTTP de integración, que requiere conexiones locales permitidas:

```powershell
npm run test:integration
```

La entrada de desarrollo liga los servicios solo a loopback. Es para trabajo local; no es la publicación definitiva ni un túnel para alojar la web clínica.

## Configuración y secretos

El archivo .env es opcional y no se crea con secretos. PHP_BINARY permite seleccionar otro ejecutable. El cargador local solo lee pares de variables y no ejecuta sustituciones o comandos del archivo. Las variables de entorno del proceso prevalecen sobre las del archivo.

No hay credenciales de MariaDB ni URL clínica configuradas. No definir secretos en web/ o en el preload. .env.example no es una credencial funcional. Los datos y snapshots se excluirán de Git aunque se generen después en storage/.

El endpoint de salud solo responde que PHP está disponible y que la base no está configurada; no expone variables, rutas, versión interna de PHP ni phpinfo. Devuelve errores JSON para rutas no previstas y 405 para métodos no permitidos en salud.

## Hallazgo de despliegue y actualización del plan

Durante T15 se comprobó que el repositorio vercel-community/php figura archivado. Su README actual desaconseja utilizar ese runtime comunitario para proyectos nuevos y remite al despliegue PHP con contenedores en Vercel. Esto actualiza la suposición anterior de los diseños, sin cambiar PHP, MariaDB o Vercel.

Se prepara Dockerfile/Caddyfile siguiendo la ruta oficial de Vercel, con frontend estático y entrada PHP pública, y server/ fuera de la raíz pública. El contenedor es una forma de empaquetar el servicio administrado, no una máquina virtual a cargo del usuario. No se mantiene una configuración activa de vercel-php archivada como si estuviera validada.

La imagen candidata usa FrankenPHP/PHP 8.5; no se ha descargado ni construido aquí. Deben comprobarse la etiqueta, extensiones, enrutamiento original, límites y disponibilidad del preset en el plan gratuito antes del despliegue. No se activa un plan de pago ni se crea infraestructura para suplir una limitación.

Docker está instalado en este equipo, pero el daemon Linux de Docker Desktop no respondió porque su pipe no existe. No se inició ni se modificó la configuración de Docker automáticamente. La ruta de preparación web/PHP local no requiere Docker.

## Evidencia de comprobaciones

| Comprobación | Resultado |
| --- | --- |
| Node/PHP disponibles | Node 24.19.0 y PHP 8.5.1 detectados |
| Extensiones de proyecto | pdo_mysql, openssl y mbstring disponibles sin editar configuración global |
| Sintaxis | JavaScript y PHP comprobados con sus ejecutables |
| Contratos de API sin sockets | npm test: tres pruebas aprobadas; salud, métodos/rutas no permitidos y puertos inválidos mediante PHP CLI/Node |
| Build web | Archivos de web preparados en dist/; sin despliegue |
| Instalación Electron | Intentada; npm respondió ENOTFOUND para registry.npmjs.org; sin instalación ni ventana ejecutada |
| HTTP web a PHP | Intentada; conexión local rechazada por entorno con EACCES; no se declara prueba HTTP aprobada |
| Docker | Binario disponible; daemon no accesible; imagen no construida |
| Vercel/MariaDB | Sin cuentas nuevas, despliegue o conexión real |

La prueba HTTP se conserva como test:integration y devuelve error si no puede ejecutar su recorrido. No se marca como aprobada o se omite silenciosamente para ocultar el bloqueo. npm test comprueba contratos PHP desde CLI y validación de configuración; no sustituye la integración HTTP ni verifica el renderizado de una página o ventana Electron.

## Pendientes y tareas siguientes

1. Con acceso de red permitido, instalar Electron y registrar package-lock.json; ejecutar y revisar la ventana.
2. Ejecutar test:integration y revisar la pantalla web desde una terminal con conexiones locales permitidas. No desactivar protecciones del sistema para resolver el error automáticamente.
3. En T16, implementar SQLite y su almacenamiento; en T17, integrar las pantallas clínicas sobre adaptadores reales.
4. En T18, validar el preset de despliegue PHP en Vercel y conexión cifrada a MariaDB; documentar cualquier incompatibilidad antes de cambiar el stack o contratar servicios.
5. Mantener D-T5-01/02/03 como candidatas hasta recibir decisión; esta preparación no crea migraciones clínicas definitivas.

## Referencias consultadas

- [Runtime comunitario y aviso de migración](https://github.com/vercel-community/php).
- [Vercel: PHP mediante contenedor](https://vercel.com/kb/guide/deploy-php-on-vercel-with-docker).
- [Electron 45.3.4](https://releases.electronjs.org/release/v45.3.4).

## Cierre

- [x] Crear estructura ejecutable y scripts de preparación.
- [x] Separar recursos públicos de código y configuración privada.
- [x] Proporcionar endpoint PHP mínimo y prueba de contratos.
- [x] Preparar arranque Electron restringido sin simular autenticación.
- [x] Documentar los bloqueos de instalación, HTTP y Docker, sin afirmar verificaciones no realizadas.
- [ ] Instalar y ejecutar Electron; generar lockfile.
- [ ] Aprobar integración HTTP, revisión visual y build del contenedor en entorno habilitado.

Resultado: preparación de código T15 entregada con comprobaciones parciales y dependencias de entorno pendientes. No se declara sistema clínico operativo.

Siguiente tarea: T16 — Preparar el almacenamiento de información en el equipo; responsable Oscar Aarón Delgadillo Fernández; ventana documental del 24 al 30 de septiembre de 2026.
