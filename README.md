# VetCare System

Prototipo escolar de gestión veterinaria y expedientes clínicos para Veterinaria La Vaquita Pinta.

## Estado

T1–T14 documentados y T15 con código de preparación web, API PHP y arranque Electron. PHP y extensiones del proyecto disponibles; instalación de Electron bloqueada por DNS y prueba HTTP local bloqueada por EACCES en el entorno de ejecución. No hay aplicación clínica conectada ni servicios desplegados. Las decisiones de captura de T5 y las aprobaciones formales permanecen pendientes.

El trabajo incluye desarrollar el sistema completo: web, API PHP, MariaDB central, Electron para Windows, SQLite local, sincronización, pruebas e instalador. Las tareas T8–T14 preparan el diseño; la implementación comienza con T15, siguiendo las asignaciones y ventanas del cronograma.

El desarrollo se entrega una tarea por vez cuando las dependencias lo permiten. Las fechas de referencia son las del cronograma documental; el historial de Git queda a cargo del usuario.

## Producto previsto

- Web responsiva para consulta y captura desde navegadores modernos, con conexión.
- Aplicación Electron para Windows con persistencia SQLite, captura y consulta offline.
- API PHP prevista en Vercel con contenedor administrado; preparación de T15 pendiente de verificación de despliegue. El runtime comunitario anterior está archivado.
- MariaDB central administrada en alwaysdata, inicialmente para demostración académica.
- Sincronización mediante API, historial de conflictos y snapshots locales.

El despliegue y la conexión segura Vercel–MariaDB están pendientes de validación técnica. El acceso web no dependerá de una computadora local encendida. Los planes gratuitos no representan una garantía de disponibilidad.

## Documentación

- [Revisión de documentos y acuerdos — T1](docs/gestion/T01_revision_documental.md)
- [Participantes y necesidades — T2](docs/gestion/T02_participantes_necesidades.md)
- [Revisión de formatos médicos — T3](docs/gestion/T03_revision_formatos_medicos.md)
- [Proceso de atención propuesto — T4](docs/gestion/T04_proceso_atencion.md)
- [Funciones y condiciones del sistema — T5](docs/gestion/T05_funciones_condiciones.md)
- [Organización y prioridades — T6](docs/gestion/T06_organizacion_prioridades.md)
- [Revisión y aprobación de requisitos — T7](docs/gestion/T07_revision_aprobacion_requisitos.md)
- [Arquitectura del sistema — T8](docs/arquitectura/T08_arquitectura_sistema.md)
- [Modelo de datos local y central — T9](docs/arquitectura/T09_modelo_datos.md)
- [Pantallas principales de escritorio — T10](docs/diseno/T10_pantallas_escritorio.md)
- [Abrir prototipo navegable de escritorio](docs/diseno/prototipo_escritorio/index.html)
- [Pantallas móviles — T11](docs/diseno/T11_pantallas_moviles.md)
- [Abrir vista previa móvil](docs/diseno/prototipo_escritorio/mobile.html)
- [Acceso y protección de información — T12](docs/arquitectura/T12_acceso_proteccion.md)
- [Guardado y recuperación — T13](docs/arquitectura/T13_guardado_recuperacion.md)
- [Revisión general del diseño — T14](docs/arquitectura/T14_revision_diseno.md)
- [Entorno y comandos de desarrollo — T15](docs/implementacion/T15_entorno_trabajo.md)

## Ejecutar la preparación local

Con Node 24 y PHP 8.5 disponibles, desde esta carpeta:

```powershell
npm run doctor
npm run check
npm test
npm run dev
```

Abrir http://127.0.0.1:5173. El servidor solo es de desarrollo; no es el alojamiento final. Para Electron, instalar dependencias con `npm install` y ejecutar `npm run dev:desktop`. La prueba HTTP separada es `npm run test:integration`; necesita conexiones locales permitidas. Véanse los bloqueos y pendientes en T15.

No se incorporan credenciales, bases clínicas reales ni respaldos de pacientes al repositorio.
