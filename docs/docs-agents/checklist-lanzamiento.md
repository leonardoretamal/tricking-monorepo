# Checklist de lanzamiento

Propósito: reunir los 20 ítems que se verifican antes de lanzar el proyecto, cada uno con su estado, una nota breve y el enlace a la regla detallada que lo gobierna.

Estados posibles: pendiente, en progreso, listo o no aplica. El agente no marca un ítem como listo sin verificarlo.

| #   | Ítem                               | Estado    | Nota                                                                                         | Regla detallada                     |
| --- | ---------------------------------- | --------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | Aviso legal                        | Pendiente | Página con datos del titular accesible desde el pie de página.                               | docs/docs-agents/reglas-legal.md    |
| 2   | Política de privacidad             | Pendiente | Página accesible desde el pie de página y enlazada desde el registro y el banner de cookies. | docs/docs-agents/reglas-legal.md    |
| 3   | Aviso de cookies                   | Pendiente | Condicional a cookies o tecnologías no esenciales. Banner antes de instalarlas.              | docs/docs-agents/reglas-cookies.md  |
| 4   | Forzar HTTPS                       | Pendiente | Redirección 301, HSTS y sin contenido mixto.                                                 | docs/docs-agents/reglas-seo.md      |
| 5   | Meta títulos y descripciones       | Pendiente | Únicos por página.                                                                           | docs/docs-agents/reglas-seo.md      |
| 6   | Datos estructurados                | Pendiente | JSON-LD validado con Rich Results Test.                                                      | docs/docs-agents/reglas-seo.md      |
| 7   | Sitemap y robots.txt               | Pendiente | Publicados y accesibles.                                                                     | docs/docs-agents/reglas-seo.md      |
| 8   | Ficha de Google                    | Pendiente | Si aplica.                                                                                   | docs/docs-agents/reglas-seo.md      |
| 9   | Favicon                            | Pendiente | En formatos modernos.                                                                        | docs/docs-agents/reglas-seo.md      |
| 10  | Texto alternativo en las imágenes  | Pendiente | Decorativas con alt vacío, informativas con alt descriptivo.                                 | docs/docs-agents/reglas-frontend.md |
| 11  | Imágenes comprimidas               | Pendiente | Formatos modernos (WebP, AVIF).                                                              | docs/docs-agents/reglas-frontend.md |
| 12  | Velocidad de carga optimizada      | Pendiente | Lighthouse con objetivo mínimo de 90 en móvil.                                               | docs/docs-agents/reglas-frontend.md |
| 13  | Contraste de colores               | Pendiente | WCAG AA: 4.5:1 en texto normal y 3:1 en texto grande y componentes de UI.                    | docs/docs-agents/reglas-frontend.md |
| 14  | Que se vea bien en el móvil        | Pendiente | Mobile-first, pruebas con viewport 390x600.                                                  | docs/docs-agents/reglas-frontend.md |
| 15  | Página 404 personalizada           | Pendiente | Verificada.                                                                                  | docs/docs-agents/reglas-frontend.md |
| 16  | Enlaces rotos arreglados           | Pendiente | Verificación de enlaces antes del cierre.                                                    | docs/docs-agents/reglas-frontend.md |
| 17  | Formularios protegidos contra spam | Pendiente | Honeypot, tiempo mínimo de llenado y captcha o Turnstile resuelto en servidor.               | docs/docs-agents/reglas-backend.md  |
| 18  | Botón de WhatsApp visible          | Pendiente | Condicional, solo si el proyecto lo usa.                                                     | docs/docs-agents/reglas-frontend.md |
| 19  | Analítica instalada                | Pendiente | Condicional. Sin cookies de terceros ni trackers invasivos.                                  | docs/docs-agents/reglas-cookies.md  |
| 20  | Una sola llamada a la acción       | Pendiente | Una CTA por pantalla.                                                                        | docs/docs-agents/reglas-frontend.md |

## Reglas de uso

- El agente no marca un ítem como listo sin verificarlo.
- Cada ítem se actualiza con su estado y una nota breve a medida que avanza el proyecto.
- Los ítems condicionales se marcan como no aplica solo cuando la condición se descarta de forma explícita.
