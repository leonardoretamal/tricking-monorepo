# Reglas de internacionalización (i18n)

Propósito: definir la librería de i18n, los idiomas soportados, la organización de las claves de traducción, el formato de fechas y números y las reglas de contenido que deben cumplir los textos del monorepo.

## Librería e idiomas

- La librería es next-intl.
- defaultLocale: 'es'.
- El proyecto soporta español e inglés.
- Alternativas consideradas: i18next y react-intl.
- Motivo: integración nativa con Next.js App Router y Server Components.

## Organización de las claves

- Las claves se organizan por módulo.
- common.json se reserva para los textos compartidos.
- Prohibido el archivo monolítico de traducciones.
- Todo texto visible en la interfaz vive en archivos de traducción por módulo.

## Códigos y formato

- Se usan códigos BCP 47.
- Las fechas y los números se formatean con utilidades nativas de i18n.

## Contenido

- El contenido técnico se traduce.
- Los nombres de trucos en inglés se mantienen porque son términos estándar del deporte (por ejemplo b-twist, aerial, raiz, cheat kick).
- El contenido de Kojo queda en español fijo si no se traduce.
- Los textos de cookies se traducen con i18n si aplica.

## Validación

El subagente i18n-checker verifica:

- Paridad de claves.
- Claves huérfanas.
- Placeholders.
- Formateo.
- Textos hardcodeados.

El CI incluye el job i18n Key Validation.

## Reglas transversales relacionadas

- Frontend: docs/docs-agents/reglas-frontend.md.
- SEO técnico (hreflang): docs/docs-agents/reglas-seo.md.
- Validación al cierre: docs/docs-agents/reglas-validacion.md.
