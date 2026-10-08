# KARDEX — demo funcional de formularios (08-10-2026)

Este paquete **es un parche** para aplicar encima de la última versión `KARDEX_integracion_figma_comentarios_20261008.zip` (o su equivalente instalado). No sustituye el proyecto completo.

## Funcionalidad incorporada
- Bloqueo del avance en Datos personales hasta completar los campos obligatorios (incluyendo documento cuando corresponda a licencia afirmativa); residencia, contacto y fotografía.
- Indicador visible de errores y marcación de controles inválidos en los pasos del formulario.
- Para avanzar desde Reclutamiento, se requiere al menos un proceso válido.
- Para avanzar desde Condiciones laborales, se requiere una adscripción, régimen, situación, fecha en cargo, ingreso inicial y jornada.
- Guardado local (`localStorage`) de procesos, estándares de competencia y datos de condiciones laborales.
- Alta, edición y eliminación con confirmación de procesos de reclutamiento, estándares, adscripciones y registros de portación; eliminación de jornadas y reingresos demostrativos.
- Documento de licencia: carga de PDF/JPG/PNG hasta 2 MB, vista previa y opción para eliminar el adjunto. La fotografía mantiene carga, vista y eliminación ya existentes.
- Validaciones mínimas en condiciones vigentes, percepciones y seguridad social.

## Consideraciones
- Es una **simulación en navegador**, no envía datos a servicios institucionales.
- Los datos guardados en `localStorage` permanecen en ese navegador/perfil; los archivos se guardan como Data URL, sujetos a límites de almacenamiento.
- Los datos sincronizados de ECCC siguen en solo lectura.
- No se modificaron los breakpoints ni se desactivaron las reglas responsive anteriores; solo se añadieron estilos puntuales para errores y botones.
- Falta confirmar compilación y pruebas de navegador con las dependencias reales del proyecto (el entorno de preparación no tiene `node_modules`).
