# Checklist de lanzamiento

Propósito: reunir los 20 ítems que se verifican antes de lanzar el proyecto, cada uno con su estado, una nota breve y el enlace a la regla detallada que lo gobierna.

Estados posibles: pendiente, en progreso, listo o no aplica. El agente no marca un ítem como listo sin verificarlo.

| #   | Ítem                               | Estado      | Nota                                                                                                                   | Regla detallada                     |
| --- | ---------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | Aviso legal                        | En progreso | Página creada y enlazada desde el pie de página; falta cargar los datos reales del titular.                            | docs/docs-agents/reglas-legal.md    |
| 2   | Política de privacidad             | En progreso | Página creada y enlazada desde el pie de página y desde el formulario de feedback; falta cargar los datos del titular. | docs/docs-agents/reglas-legal.md    |
| 3   | Aviso de cookies                   | No aplica   | Solo se usa la cookie de idioma `NEXT_LOCALE`, estrictamente necesaria; sin analítica ni terceros.                     | docs/docs-agents/reglas-cookies.md  |
| 4   | Forzar HTTPS                       | En progreso | Cabeceras HSTS y de seguridad en `next.config.ts`; falta verificar la redirección 301 en el despliegue de Cloudflare.  | docs/docs-agents/reglas-seo.md      |
| 5   | Meta títulos y descripciones       | Listo       | Cada página define `generateMetadata` propio (trucos, tips, feedback, panel con noindex).                              | docs/docs-agents/reglas-seo.md      |
| 6   | Datos estructurados                | En progreso | JSON-LD `WebSite` más `SearchAction` en la home; falta `BreadcrumbList`/ficha por truco y validar con Rich Results.    | docs/docs-agents/reglas-seo.md      |
| 7   | Sitemap y robots.txt               | Listo       | `robots.ts` y `sitemap.ts` publicados (1292 URLs) y respondiendo 200.                                                  | docs/docs-agents/reglas-seo.md      |
| 8   | Ficha de Google                    | En progreso | Meta de verificación de Search Console cableada; falta registrar el sitio (operación externa del usuario).             | docs/docs-agents/reglas-seo.md      |
| 9   | Favicon                            | Listo       | `icon.svg` y `apple-icon` servidos; no se agrega `favicon.ico` legado.                                                 | docs/docs-agents/reglas-seo.md      |
| 10  | Texto alternativo en las imágenes  | Listo       | No hay imágenes de contenido; los iconos son decorativos con `aria-hidden`.                                            | docs/docs-agents/reglas-frontend.md |
| 11  | Imágenes comprimidas               | No aplica   | No se alojan imágenes propias; el contenido de terceros se enlaza, no se almacena.                                     | docs/docs-agents/reglas-frontend.md |
| 12  | Velocidad de carga optimizada      | Pendiente   | Lighthouse no ejecutado (la sesión no tiene la herramienta; Playwright no lo cubre). Pendiente de medir.               | docs/docs-agents/reglas-frontend.md |
| 13  | Contraste de colores               | Listo       | Contraste WCAG AA medido y ajustado; ratios documentados en `design.md`.                                               | docs/docs-agents/reglas-frontend.md |
| 14  | Que se vea bien en el móvil        | Listo       | Verificado en navegador real a 390x600 sin desborde horizontal, incluida la burbuja del asistente.                     | docs/docs-agents/reglas-frontend.md |
| 15  | Página 404 personalizada           | Listo       | Existe y responde 404 (se quitó el `loading.tsx` de ruta que la convertía en 200).                                     | docs/docs-agents/reglas-frontend.md |
| 16  | Enlaces rotos arreglados           | En progreso | Enlaces internos verificados (footer, navegación, detalle); falta la revisión final de enlaces externos.               | docs/docs-agents/reglas-frontend.md |
| 17  | Formularios protegidos contra spam | Listo       | Honeypot, tiempo mínimo de llenado, Turnstile resuelto en el servidor y rate limiting en el POST público.              | docs/docs-agents/reglas-backend.md  |
| 18  | Botón de WhatsApp visible          | No aplica   | El proyecto no usa WhatsApp.                                                                                           | docs/docs-agents/reglas-frontend.md |
| 19  | Analítica instalada                | No aplica   | Condicional no activada; no se instalaron cookies no esenciales.                                                       | docs/docs-agents/reglas-cookies.md  |
| 20  | Una sola llamada a la acción       | Listo       | Formulario de feedback y vistas de detalle con una CTA por pantalla.                                                   | docs/docs-agents/reglas-frontend.md |

## Reglas de uso

- El agente no marca un ítem como listo sin verificarlo.
- Cada ítem se actualiza con su estado y una nota breve a medida que avanza el proyecto.
- Los ítems condicionales se marcan como no aplica solo cuando la condición se descarta de forma explícita.
