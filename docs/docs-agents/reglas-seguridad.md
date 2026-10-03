# Reglas de seguridad

Propósito: reunir los estándares de autenticación, permisos, manejo de secretos, validación de entradas, CORS, rate limiting, cabeceras, HTTPS, antispam y manejo de datos que aplican a todo el monorepo.

## Alcance del subagente security

El subagente security revisa, como mínimo, los siguientes puntos:

- Autenticación.
- Permisos.
- Exposición de secretos.
- Validación de entradas.
- Dependencias vulnerables.
- CORS.
- Rate limiting.
- Cabeceras.
- HTTPS forzado.
- Protección contra spam.
- Ausencia de secretos en localStorage.
- Ausencia de escritura en entornos que no sean dev.
- Pruebas con datos no reales.

## Autenticación y permisos

- La autenticación recomendada es Auth.js (NextAuth) con adaptador de Drizzle sobre Neon. No aplica en la Fase 0. Se activa cuando se implemente el skill tree y los combos.
- Los endpoints de escritura y de autenticación exigen idempotencia y rate limiting.
- Los permisos siguen el principio de mínimo privilegio, tanto en la aplicación como en la infraestructura.

## Secretos y credenciales

- Ninguna credencial en código. Todo se maneja por variables de entorno.
- Las credenciales se manejan solo por variables de entorno.
- Nunca se escribe el valor real de un secreto. Se usan placeholders como your-secret-here o change-me.
- Prohibido guardar tokens, contraseñas o datos personales en localStorage.
- Los tokens de sesión no se cachean en el navegador; se usan cookies httpOnly.
- No se guardan secretos, tokens ni datos sensibles en el almacenamiento del navegador.
- El detalle completo está en reglas-secretos.md.

## Validación de entradas

- Validar body, params y query con Zod antes de tocar la lógica o la base de datos.
- Validación estricta de los parámetros de listados.
- Lista blanca de campos permitidos.
- En los uploads se valida el MIME real, el tamaño y el nombre sanitizado.

## CORS, cabeceras y HTTPS

- CORS con orígenes explícitos. Prohibido el comodín en producción.
- Se configuran cabeceras de seguridad.
- Forzar HTTPS: redirección 301, HSTS y sin contenido mixto. El detalle está en reglas-seo.md.

## Rate limiting y protección contra spam

- Idempotencia y rate limiting en los endpoints de escritura y de autenticación.
- Formularios protegidos contra spam: honeypot, validación de tiempo mínimo de llenado y captcha o Turnstile en formularios públicos.
- El captcha se resuelve en el servidor.
- La protección antispam aplica a cualquier formulario público.

## Manejo de datos

- No se cachean tokens, contraseñas ni datos personales.
- No se guardan secretos ni datos sensibles en el almacenamiento del navegador.
- Las pruebas usan datos no reales. Prohibido usar credenciales o datos reales.
- Los logs nunca muestran contraseñas, tokens, claves, credenciales, datos sensibles, datos personales ni códigos de verificación (ver reglas-logs.md).

## Escritura en entornos

- La autorización para escribir secretos por CLI o API se limita al entorno dev. Prohibido escribir en staging, prod, qa o uat.
- Prohibido conectar a entornos compartidos, staging o producción durante pruebas locales.

## Reglas transversales relacionadas

- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Logs: docs/docs-agents/reglas-logs.md.
- Cookies y consentimiento: docs/docs-agents/reglas-cookies.md.
- SEO técnico (HTTPS): docs/docs-agents/reglas-seo.md.
- Validación al cierre: docs/docs-agents/reglas-validacion.md.
