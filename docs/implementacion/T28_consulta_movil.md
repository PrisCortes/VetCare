# T28 - Consulta conectada desde móviles

| Dato | Valor |
| --- | --- |
| Responsable del cronograma | Diego Alonso Coronel Vargas (DA) |
| Fechas previstas | 12 al 21 de octubre de 2026 |
| Implementación | 21 de noviembre de 2026 |
| Estado | Captura conectada adaptable preparada; recorrido en teléfonos físicos y despliegue HTTPS pendientes |

## Resultado

La pantalla conectada **Preparar atención** se adapta ahora específicamente a anchos de hasta 800 px. Tras seleccionar un paciente, la vista móvil conserva un bloque de contexto con paciente, especie y propietario antes de elegir el tipo de atención.

Para consulta, vacunación y desparasitación:

- Los campos se presentan en una sola columna con texto de 16 px, controles de al menos 48 px y teclados numérico o decimal donde corresponde.
- Las acciones **Revisar captura** y **Guardar** ocupan todo el ancho y quedan separadas, para evitar pulsaciones accidentales.
- Los errores, mensajes de estado y vista previa mantienen el foco y el desplazamiento necesario para leerlos.
- Las pestañas de tipo de atención, la recuperación de registros y los botones de corrección conservan áreas táctiles visibles.

Las validaciones, la autorización y el guardado central existentes no cambian. Esta fase no duplica formularios ni crea una aplicación móvil nativa: usa la misma web conectada y la misma API.

## Cómo comprobar esta fase

Desde la raíz del proyecto:

```powershell
npm test
npm run check
npm run build
npm run dev
```

Abre la URL que muestra `npm run dev`, inicia sesión y, en las herramientas de desarrollo del navegador, usa anchos de **360 px**, **390 px** y **430 px**. Luego:

1. En **Pacientes**, selecciona un paciente activo y pulsa **Preparar atención**.
2. Comprueba que arriba aparece el contexto de paciente, especie y propietario; no debe haber desplazamiento horizontal de toda la página.
3. En **Consulta**, captura fecha, mediciones opcionales y motivo. Con el teclado abierto, revisa que los controles continúan siendo alcanzables y que **Revisar captura** y **Guardar consulta** son botones independientes de ancho completo.
4. Deja vacío el motivo y pulsa revisar: el resumen de errores debe recibir el foco, sin eliminar los valores escritos.
5. Cambia a **Vacunación** y **Desparasitación**. Verifica que los campos y las acciones se ajustan a una columna y conservan las validaciones existentes.
6. Repite la prueba con texto ampliado y orientación horizontal. En un teléfono real, comprueba además teclado regional, selector de fecha y área segura inferior.

La ejecución local no permite afirmar compatibilidad Android/iOS ni acceso desde otro equipo: el despliegue HTTPS y las pruebas físicas siguen siendo necesarios.

## Evidencia automatizada

- `npm test` incluye la comprobación de la estructura móvil de la pantalla de atención, además de las validaciones clínicas existentes.
- `npm run check` valida sintaxis PHP y JavaScript.
- `npm run build` genera la web en `dist/` sin publicar un despliegue.

## Límites y siguiente fase

T28 no integra vacunas y desparasitaciones dentro del historial o carnet conectado, no descarga cambios de otros equipos y no habilita captura sanitaria offline. Esas responsabilidades permanecen en T29 y en la secuencia de sincronización posterior.

La siguiente fase en el orden solicitado es **T29 — Unir expediente y carnet (H4)**.

## Responsable, fechas y commit

- Responsable: Diego Alonso Coronel Vargas (DA).
- Ventana del cronograma: 12 al 21 de octubre de 2026.
- Commit sugerido, a realizar por el usuario: `feat(T28): adaptar consulta conectada a móviles`.
