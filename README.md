# VetCare System

Prototipo escolar de gestión veterinaria y expedientes clínicos para Veterinaria La Vaquita Pinta.

## Estado

T1 a T3: revisión documental, acuerdos, registro de participantes y necesidades y análisis de formatos médicos preparados. La validación clínica permanece pendiente. Todavía no existe código de la aplicación ni servicios desplegados.

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

No se incorporan credenciales, bases clínicas reales ni respaldos de pacientes al repositorio.
