# T29 - Unir expediente y carnet (H4)

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Diego Alonso Coronel Vargas (DA) |
| Fechas previstas | 16 al 22 de octubre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Integración central preparada y verificada con tablas temporales; recorrido visual y aprobación H4 pendientes |

## Resultado

El expediente conectado conserva la lista y los filtros de consultas de T24, y ahora añade una sección de **Antecedentes sanitarios**. Esta presenta vacunas y desparasitaciones del mismo paciente, con fecha, producto, datos propios, próxima fecha, versión y autoría.

El botón **Ver carnet sanitario**, disponible desde Expediente y Pacientes, abre una pantalla conectada por paciente. El carnet separa **Vacunación** y **Desparasitación**, mantiene el nombre, especie, propietario e identificador de la ficha, y usa las mismas fuentes centrales que los antecedentes del expediente.

La API incorpora `GET /api/v1/carnet?patientId=…`. Requiere sesión y `clinical.read`, nunca acepta escrituras y devuelve únicamente eventos del paciente solicitado. El historial también recupera los 50 eventos sanitarios más recientes para no mezclar su paginación con la de consultas; el carnet muestra los 100 más recientes e informa de manera explícita si hubiera más.

## Cómo comprobar esta fase

Con las migraciones hasta `005_sanitary_events` aplicadas, desde la raíz ejecuta:

```powershell
npm run db:migrate
npm run test:history:database
npm test
npm run check
npm run build
npm run dev
```

La prueba de historial utiliza tablas temporales y no modifica expedientes reales. En el navegador:

1. Inicia sesión y crea o elige un paciente activo.
2. En **Preparar atención**, guarda una consulta, una vacunación y una desparasitación ficticias para ese mismo paciente.
3. Abre **Ver expediente**. Confirma que las consultas siguen sujetas a Buscar/Desde/Hasta y que, abajo, aparecen ambos antecedentes sanitarios con su versión y próxima fecha.
4. Pulsa **Ver carnet sanitario**. Cambia entre Vacunación y Desparasitación y verifica que no aparecen eventos de otro paciente con nombre similar.
5. Corrige una vacuna o desparasitación desde Atención, vuelve a actualizar el expediente y el carnet y verifica la nueva versión y los datos modificados.
6. Abre un paciente inactivo: debe permitir consultar su expediente y carnet, pero no habilitar nuevas capturas.
7. Sin iniciar sesión, abre `GET /api/v1/carnet` en una sesión nueva: debe responder acceso no autenticado; `DELETE /api/v1/carnet` debe responder método no permitido.

## Evidencia automatizada

- `npm run test:history:database` comprueba en MariaDB temporal que consultas, vacuna y desparasitación se mantienen separadas por paciente y aparecen en expediente/carnet.
- `npm test` verifica el render escapado de los antecedentes y del carnet.
- `npm run check` y `npm run build` validan sintaxis y generación web.

## Límites y puerta H4

T29 no crea recordatorios, calendarios automáticos, exportación, recetas, carga de archivos ni una aplicación móvil nativa. Tampoco habilita eventos sanitarios offline, descarga cambios de otros equipos ni resuelve conflictos concurrentes.

La puerta **H4** requiere además ejecutar el recorrido visual con datos de prueba y registrar una decisión de revisión; esta implementación y sus pruebas no equivalen a una aprobación clínica automática.

## Responsable, fechas y commit

- Responsable: Diego Alonso Coronel Vargas (DA).
- Ventana del cronograma: 16 al 22 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T29): integrar expediente y carnet sanitario`.
