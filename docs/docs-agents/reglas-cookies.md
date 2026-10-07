# Reglas de cookies y consentimiento

Propósito: definir cuándo se activa el aviso de cookies, cómo se clasifican, cómo se recoge y registra el consentimiento y cómo lo respeta el backend.

## Activación condicional

- El banner y estas reglas se activan si el monorepo usa cookies o tecnologías similares no esenciales.
- Si solo se usan cookies estrictamente necesarias, no se muestra banner.
- La recomendación principal es vanilla-cookieconsent. Alternativa: react-cookie-consent.
- Se activa con la analítica.

## Clasificación

Categorías:

- Estrictamente necesarias (sin banner).
- Preferencias.
- Analítica.
- Marketing.

Las categorías con banner son preferencias, analítica y marketing.

## Embeds de terceros

- Los vídeos de terceros (YouTube, Vimeo, Dailymotion) no se cargan al abrir la ficha: se muestra una fachada con la portada y un botón, y el iframe se carga solo tras la acción explícita del usuario.
- Por eso, mientras el usuario no hace clic, no se instalan cookies ni se hacen peticiones a esos terceros, y no cuentan como categoría no esencial.
- Cuando la plataforma lo permite se usa el dominio de privacidad (`youtube-nocookie`, `dailymotion` sin cookies de seguimiento, etc.).
- La fachada y su carga al clic se documentan en el inventario de cookies.
- Si en el futuro se cargara un embed sin acción del usuario, ese embed sí entra en la clasificación con banner y exige consentimiento previo.

## Banner y granularidad

- El banner se muestra antes de instalar cookies no esenciales.
- La granularidad es por categoría.
- Los botones tienen el mismo peso visual.
- Sin patrones oscuros.
- Sin cookie wall salvo que la ley lo permita.

## Consentimiento

- El consentimiento se registra con fecha, hora, versión y categorías.
- Existe un enlace para cambiar o retirar el consentimiento en el pie de página o en Ajustes.
- El registro del consentimiento vive en el servidor o en un servicio confiable.

## Inventario

- Se mantiene un inventario de cookies en la documentación.

## Respeto en el backend

- El backend respeta la elección del usuario.

## Internacionalización

- Los textos del banner y de la gestión de consentimiento se traducen con i18n si aplica (ver reglas-i18n.md).

## Reglas transversales relacionadas

- Frontend (banner): docs/docs-agents/reglas-frontend.md.
- Legal y cumplimiento: docs/docs-agents/reglas-legal.md.
- i18n: docs/docs-agents/reglas-i18n.md.
- Seguridad: docs/docs-agents/reglas-seguridad.md.
