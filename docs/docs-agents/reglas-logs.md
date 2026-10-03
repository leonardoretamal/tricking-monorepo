# Reglas de logs

Propósito: definir la herramienta de logging y qué información se debe mostrar y qué información nunca se debe mostrar en los registros del monorepo.

## Herramienta

- La herramienta de logging es Pino.
- Alternativas consideradas: Winston y la consola estructurada de Next.js.
- Motivo: alto rendimiento, formato JSON nativo e integración con cualquier destino.

## Qué deben mostrar los logs

- Parámetros de entrada.
- Inicio de procesos.
- Resultado de consultas.
- Cantidad de registros.
- Errores controlados e inesperados con trace_id.

## Qué nunca deben mostrar los logs

- Contraseñas.
- Tokens.
- Claves.
- Credenciales.
- Datos sensibles.
- Datos personales.
- Códigos de verificación.

## Reglas transversales relacionadas

- Seguridad: docs/docs-agents/reglas-seguridad.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
