# Reglas de logs

Propósito: definir la herramienta de logging y qué información se debe mostrar y qué información nunca se debe mostrar en los registros del monorepo.

## Herramienta

- La herramienta de logging es Pino.
- Alternativas consideradas: Winston y la consola estructurada de Next.js.
- Motivo: alto rendimiento, formato JSON nativo e integración con cualquier destino.
- Si el repositorio ya tiene una librería de logging configurada, se usa esa.

## Herramienta según stack

- Node.js (el stack del monorepo): Pino, Winston o Bunyan. En este repositorio, Pino.
- Python: logging estructurado o structlog.
- Go: zap, logrus o slog.
- Laravel: los canales nativos.
- En todos los casos, si el repositorio ya tiene una librería de logging configurada, se usa esa.

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
