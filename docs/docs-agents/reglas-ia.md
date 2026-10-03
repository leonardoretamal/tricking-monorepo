# Reglas de IA

Propósito: definir las reglas de seguridad y de uso de IA en el producto y en el desarrollo del monorepo. Se activa cuando el repositorio integra IA como parte del producto (por ejemplo el chatbot de tricking de la sección 28.1 de AGENTS.md) y cuando se documenta el uso de IA para el desarrollo.

## Uso de IA en el producto

Seguridad:

- Sanitización y validación de prompts. El input del usuario se sanitiza. Los prompts del sistema viven en el backend. Nunca se concatena input del usuario dentro de un prompt de sistema sin delimitadores y validación.
- Filtrado de datos sensibles. Ningún dato sensible se envía al modelo. Se filtra o seudonimiza el contexto antes de enviarlo. Los logs no llevan información sensible. Se desactiva el almacenamiento de prompts o se usa retención cero.
- Validación de la respuesta del modelo. Siempre se valida contra un esquema (JSON con Zod). El código generado nunca se ejecuta. El HTML se sanitiza antes de renderizar. Las URL o rutas se validan contra una lista blanca.
- Control de abuso y costos. Rate limiting más estricto que en los endpoints normales. Límite de tokens por petición y por usuario. Los errores del proveedor se manejan sin revelar detalles. Se registra el consumo por petición.
- Trazabilidad. trace_id por llamada. Logs con metadatos y sin el contenido completo del prompt cuando tiene datos del usuario.
- Selección de proveedor y modelos. Se declaran en docs/docs-agents/stack-tecnico.md. El cambio requiere autorización. Las claves viven en variables de entorno (ver reglas-secretos.md).

## Uso de IA para desarrollo

- Las skills instaladas y los agentes configurados se registran en docs/docs-agents/stack-tecnico.md y en AGENTS.md, con su propósito y cuándo se activan.
- Las reglas específicas de IA del repositorio viven en AGENTS.md y en los documentos referenciados.

## Reglas transversales relacionadas

- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Backend: docs/docs-agents/reglas-backend.md.
- Logs: docs/docs-agents/reglas-logs.md.
- Validación al cierre: docs/docs-agents/reglas-validacion.md.
- Pendientes de IA del producto: sección 28.1 de AGENTS.md.
