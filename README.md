# VetCare System

Prototipo escolar de gestión veterinaria y expedientes clínicos para Veterinaria La Vaquita Pinta.

## Estado

T1 a T6 preparados; paquete T7, arquitectura T8, modelo lógico T9 y prototipos de escritorio T10 y móvil T11 disponibles. La aprobación de requisitos y las tres decisiones de captura de T5 permanecen pendientes. La validación clínica permanece pendiente. Existe código de prototipo visual; todavía no hay aplicación clínica conectada ni servicios desplegados.

El trabajo incluye desarrollar el sistema completo: web, API PHP, MariaDB central, Electron para Windows, SQLite local, sincronización, pruebas e instalador. Las tareas T8–T14 preparan el diseño; la implementación comienza con T15, siguiendo las asignaciones y ventanas del cronograma.

El desarrollo se entrega una tarea por vez cuando las dependencias lo permiten. Las fechas de referencia son las del cronograma documental; el historial de Git queda a cargo del usuario.

## Producto previsto

- Web responsiva para consulta y captura desde navegadores modernos, con conexión.
- Aplicación Electron para Windows con persistencia SQLite, captura y consulta offline.
- API PHP desplegada en Vercel mediante el runtime comunitario `vercel-php`.
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

No se incorporan credenciales, bases clínicas reales ni respaldos de pacientes al repositorio.
