# Checklist de lanzamiento

Propósito: reunir los 20 ítems que se verifican antes de lanzar el proyecto, cada uno con su estado, una nota breve y el enlace a la regla detallada que lo gobierna.

Estados posibles: pendiente, en progreso, listo o no aplica. El agente no marca un ítem como listo sin verificarlo.

| #   | Ítem                               | Estado      | Nota                                                                                                                    | Regla detallada                     |
| --- | ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | Aviso legal                        | Pendiente   | Página con datos del titular accesible desde el pie de página.                                                          | docs/docs-agents/reglas-legal.md    |
| 2   | Política de privacidad             | Pendiente   | Página accesible desde el pie de página y enlazada desde el formulario de feedback.                                     | docs/docs-agents/reglas-legal.md    |
| 3   | Aviso de cookies                   | No aplica   | Solo se usa la cookie de idioma `NEXT_LOCALE`, estrictamente necesaria; sin analítica ni terceros.                      | docs/docs-agents/reglas-cookies.md  |
| 4   | Forzar HTTPS                       | Pendiente   | Redirección 301, HSTS y sin contenido mixto; se verifica en el despliegue de Cloudflare.                                | docs/docs-agents/reglas-seo.md      |
| 5   | Meta títulos y descripciones       | Listo       | Cada página define `generateMetadata` propio (trucos, tips, feedback, panel con noindex).                               | docs/docs-agents/reglas-seo.md      |
| 6   | Datos estructurados                | Pendiente   | JSON-LD validado con Rich Results Test.                                                                                 | docs/docs-agents/reglas-seo.md      |
| 7   | Sitemap y robots.txt               | Pendiente   | Publicados y accesibles.                                                                                                | docs/docs-agents/reglas-seo.md      |
| 8   | Ficha de Google                    | Pendiente   | Si aplica.                                                                                                              | docs/docs-agents/reglas-seo.md      |
| 9   | Favicon                            | Pendiente   | Hoy `/favicon.ico` responde 404. Falta agregarlo en formatos modernos.                                                  | docs/docs-agents/reglas-seo.md      |
| 10  | Texto alternativo en las imágenes  | Listo       | No hay imágenes de contenido; los iconos son decorativos con `aria-hidden`.                                             | docs/docs-agents/reglas-frontend.md |
| 11  | Imágenes comprimidas               | No aplica   | No se alojan imágenes propias; el contenido de terceros se enlaza, no se almacena.                                      | docs/docs-agents/reglas-frontend.md |
| 12  | Velocidad de carga optimizada      | Pendiente   | Lighthouse no ejecutado (la sesión no tiene la herramienta; Playwright no lo cubre). Pendiente de medir.                | docs/docs-agents/reglas-frontend.md |
| 13  | Contraste de colores               | En progreso | Revisado por código; pendiente medir contraste real de las clases `tb-cat-*` usadas como texto.                         | docs/docs-agents/reglas-frontend.md |
| 14  | Que se vea bien en el móvil        | Listo       | Verificado en navegador real a 390x600 sin desborde horizontal en las secciones nuevas.                                 | docs/docs-agents/reglas-frontend.md |
| 15  | Página 404 personalizada           | Listo       | Existe y responde 404 (se quitó el `loading.tsx` de ruta que la convertía en 200).                                      | docs/docs-agents/reglas-frontend.md |
| 16  | Enlaces rotos arreglados           | En progreso | Fase 15 verificó los enlaces cruzados; se corrigió el breadcrumb `/admin`. Falta la revisión final de enlaces externos. | docs/docs-agents/reglas-frontend.md |
| 17  | Formularios protegidos contra spam | Listo       | Honeypot, tiempo mínimo de llenado, Turnstile resuelto en el servidor y rate limiting en el POST público.               | docs/docs-agents/reglas-backend.md  |
| 18  | Botón de WhatsApp visible          | No aplica   | El proyecto no usa WhatsApp.                                                                                            | docs/docs-agents/reglas-frontend.md |
| 19  | Analítica instalada                | No aplica   | Condicional no activada; no se instalaron cookies no esenciales.                                                        | docs/docs-agents/reglas-cookies.md  |
| 20  | Una sola llamada a la acción       | Listo       | Formulario de feedback y vistas de detalle con una CTA por pantalla.                                                    | docs/docs-agents/reglas-frontend.md |

## Reglas de uso

- El agente no marca un ítem como listo sin verificarlo.
- Cada ítem se actualiza con su estado y una nota breve a medida que avanza el proyecto.
- Los ítems condicionales se marcan como no aplica solo cuando la condición se descarta de forma explícita.
