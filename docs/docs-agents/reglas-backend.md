# Reglas de backend

Propósito: definir los estándares de validación, manejo de errores, consultas, listados, endpoints, migraciones y arquitectura que rigen todo el backend del monorepo.

## Validación de entradas

- Validar body, params y query con Zod antes de tocar la lógica o la base de datos.
- Validación estricta de los parámetros de listados.
- Lista blanca de campos permitidos.
- Índices en las columnas usadas.
- Plan de ejecución revisado en las consultas críticas.

## Manejo de errores y respuestas

- try/catch en las operaciones importantes.
- Códigos HTTP correctos.
- Middleware centralizado.
- No se devuelven errores internos crudos al cliente.

## Consultas y base de datos

- Prohibida la concatenación de strings en consultas.
- Transacciones en operaciones que tocan varias tablas.
- Carga anticipada para evitar el problema N+1.
- Soft delete por defecto en entidades con relaciones o auditoría. Hard delete solo para datos temporales.
- Migraciones versionadas con avance y reversión.
- Fechas en UTC.
- Sin float para dinero.

## Listados

- La paginación, la búsqueda, los filtros y el ordenamiento se resuelven en la sentencia de la base de datos. Prohibido filtrar, ordenar o paginar en código de aplicación.
- El total de resultados se calcula en la base de datos.

## Seguridad de endpoints

- Idempotencia y rate limiting en los endpoints de escritura y de autenticación.
- CORS con orígenes explícitos. Prohibido el comodín en producción.
- Formularios protegidos contra spam: honeypot, validación de tiempo mínimo de llenado y captcha o Turnstile en formularios públicos. El captcha se resuelve en el servidor.
- Las credenciales se manejan solo por variables de entorno. El detalle está en reglas-secretos.md.

## Carga de archivos

- Validar el MIME real, el tamaño y el nombre sanitizado en los uploads.

## Arquitectura

- Arquitectura asíncrona con async/await y try/catch.

## Reglas transversales relacionadas

- Seguridad: docs/docs-agents/reglas-seguridad.md.
- Logs: docs/docs-agents/reglas-logs.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Cookies y consentimiento: docs/docs-agents/reglas-cookies.md.
