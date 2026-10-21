# VetCare System

Prototipo escolar de gestión veterinaria y expedientes clínicos para Veterinaria La Vaquita Pinta.

## Estado

T1-T14 documentados; T15 prepara web/PHP/Electron, T16 incorpora SQLite técnico y T17 integra las pantallas. T18 tiene conexión MariaDB con TLS comprobada por el usuario en su terminal. T19 añade inicio de sesión conectado, permisos y administración de cuentas; faltan aplicar su esquema, crear el primer administrador y completar el recorrido real. No hay todavía guardado clínico, autorización offline o despliegue remoto. Las decisiones de captura de T5 y las aprobaciones formales permanecen pendientes.

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
- [Almacenamiento SQLite y prueba práctica — T16](docs/implementacion/T16_almacenamiento_local.md)
- [Pantallas integradas de escritorio - T17](docs/implementacion/T17_pantallas_escritorio.md)
- [Comunicación con MariaDB y configuración práctica - T18](docs/implementacion/T18_comunicacion_central.md)
- [Inicio de sesión y permisos - T19](docs/implementacion/T19_inicio_sesion_permisos.md)
- [Registro y gestión de propietarios - T20](docs/implementacion/T20_propietarios.md)
- [Pacientes, vínculo con propietario y mejora de carga - T21](docs/implementacion/T21_pacientes.md)
- [Formularios y validación de atención - T22](docs/implementacion/T22_formularios_atencion.md)
- [Guardado de consultas y tratamientos - T23](docs/implementacion/T23_consultas_tratamientos.md)
- [Expediente, antecedentes y versiones - T24](docs/implementacion/T24_historial_clinico.md)
- [Captura local sin internet - T25](docs/implementacion/T25_registro_sin_internet.md)
- [Pruebas de funciones básicas - T26](docs/implementacion/T26_pruebas_funciones_basicas.md)
- [Vacunas y desparasitaciones - T27](docs/implementacion/T27_vacunas_desparasitaciones.md)
- [Consulta conectada desde móviles - T28](docs/implementacion/T28_consulta_movil.md)
- [Pendientes de conexión - T32](docs/implementacion/T32_pendientes_conexion.md)
- [Envío y actualización de pendientes - T34](docs/implementacion/T34_envio_actualizacion.md)

T25 integra preparación de cuenta y captura offline en Electron, registros cifrados por cuenta, autorización de 72 horas y cola local pendiente. Su cierre fue confirmado por el usuario. Requiere `offline:keys` y preparación previa con conexión; T34 agrega el envío de propietarios, pacientes y consultas.

T26 reúne las pruebas automatizadas del núcleo y las comprobaciones de T23/T24 contra MariaDB TLS mediante tablas temporales. La sincronización, los recorridos visuales y las pruebas de compatibilidad siguen pendientes.

T27 habilita el guardado central de vacunaciones y desparasitaciones, sus correcciones y versiones. El historial/carnet conectado y el envío offline de estos eventos siguen pendientes.

T28 adapta la consulta conectada a anchos de teléfono: conserva el paciente seleccionado, presenta una sola columna de captura y acciones táctiles amplias. Requiere conexión y un navegador moderno; no es una aplicación nativa ni integra todavía el carnet al expediente (T29).

T32 añade estados, orden, intentos y recuperación para la cola local offline. Todavía no envía operaciones al servidor; ese intercambio corresponde a T34.

T34 sincroniza propietarios, pacientes y consultas pendientes al iniciar sesión con conexión o mediante acción manual. La recepción de cambios de otros equipos y la conciliación de conflictos siguen pendientes.

T24 incorpora Ver expediente desde pacientes, consultas por fecha, filtros, último peso con origen y versiones de solo lectura. Utiliza las tablas de T23; no añade migraciones. El historial sanitario completo y la persistencia offline siguen pendientes.

T23 habilita Guardar consulta y Guardar corrección en el formulario conectado, con recuperación de registros y versiones. Aplicar `004_consultations` con `npm run db:migrate`. Revisar captura sigue siendo una operación sin guardado; los eventos sanitarios se guardan por separado desde T27.

T22 permite preparar y validar una atención desde un paciente central. La vista previa indica explícitamente que no se ha guardado. La persistencia de consultas corresponde a T23; T22 no requiere una nueva migración.

T20 integra el directorio central de propietarios con alta, edición, baja y reactivación. Requiere `npm run db:migrate`; ver su recorrido de comprobación. La persistencia clínica offline todavía no está habilitada.

T21 integra pacientes multiespecie y su relación con propietarios. Aplicar `003_patients` con `npm run db:migrate` antes de probar pacientes o bajas de propietarios. También corrige el destello de acceso al recargar, agrupa la carga inicial con la sesión y reduce peticiones repetidas. La mejora de tiempo real sigue pendiente de medición con el alojamiento.

T18 incorpora el conector PHP-MariaDB y `npm run db:check`. El usuario confirmó `DB_OK` con TLS en su terminal; el despliegue remoto sigue pendiente.

## Ejecutar la preparación local

Con Node 24 y PHP 8.5 disponibles, desde esta carpeta:

```powershell
npm run doctor
npm run check
npm test
npm run dev
```

Abrir http://127.0.0.1:5173. El servidor solo es de desarrollo; no es el alojamiento final. Para Electron, instalar dependencias con `npm install` y ejecutar `npm run dev:desktop`. La prueba HTTP separada es `npm run test:integration`; necesita conexiones locales permitidas. Véanse los bloqueos y pendientes en T15.

La aplicación solicita iniciar sesión (ver preparación de T19). Después inicia vacía. **Cargar datos de demostración** permite explorar las pantallas con una muestra ficticia en memoria. Los formularios revisan la captura sin guardado clínico. La revisión visual de estas pantallas en Electron sigue pendiente.

En **Estado del entorno**, T16 conserva un panel para guardar un texto ficticio en SQLite y recuperarlo al reiniciar. Las pruebas específicas son `npm run test:storage` y `npm run test:desktop-storage`. Los bloqueos históricos de T15 se distinguen de la ejecución posterior confirmada por el usuario; no se interpretan como resultados fallidos en su terminal.

No se incorporan credenciales, bases clínicas reales ni respaldos de pacientes al repositorio.
