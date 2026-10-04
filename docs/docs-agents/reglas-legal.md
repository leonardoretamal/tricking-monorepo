# Reglas legales y de cumplimiento

Propósito: definir las páginas legales exigibles, los enlaces obligatorios, el registro de la versión de la política aceptada y cuándo se activan estas obligaciones.

## Aviso legal

- Es una página accesible desde el pie de página con los datos del titular.

## Política de privacidad

- Es una página accesible desde el pie de página.
- Describe qué datos se recogen, para qué, base legal, retención, terceros y derechos.

## Enlaces obligatorios

- Enlace desde el formulario de registro.
- Enlace desde el banner de cookies.

## Registro de versión aceptada

- Se registra la versión de la política de privacidad aceptada por el usuario.

## Activación

- Estas páginas se activan solo cuando el proyecto va a producción o es comercial.
- En desarrollo quedan pendientes de lanzamiento.

## Contenido de terceros y retiro

Política del proyecto (decidida por el usuario el 2026-10-04):

- Los vídeos de Loopkicks son contenido gratuito: se muestran desde su URL original (hotlink), con crédito y enlace, pero NUNCA se descargan ni se almacenan (nada de Loopkicks sube a R2).
- De Kojo's Trick Lab se toma solo su conocimiento de técnica (nombres de trucos/técnicas y tips), NO sus vídeos. Las entradas de técnica llevan tips PROPIOS del proyecto, con crédito y enlace a la página original del tutorial; los vídeos de Kojo no se embeben (Vimeo responde 403 en dominios de terceros) ni se almacenan.
- El bucket de Cloudflare R2 queda reservado para contenido propio o con licencia. El script de subida se niega a correr salvo que se confirme que se tienen derechos (`--confirm-rights`).
- Cada truco lleva una descripción propia de "cómo se hace" escrita por el proyecto; no se copia ni se parafrasea de cerca el texto de las fuentes.
- El pie de página incluye un aviso de "no afiliado" y el crédito a las fuentes.
- Mecanismo de retiro: ante el pedido de un titular se retira el contenido de inmediato (soft delete del vídeo o de la técnica por su id). El mecanismo es rápido y no requiere despliegue.

## Reglas transversales relacionadas

- Cookies y consentimiento: docs/docs-agents/reglas-cookies.md.
- SEO técnico: docs/docs-agents/reglas-seo.md.
- Checklist de lanzamiento: docs/docs-agents/checklist-lanzamiento.md.
