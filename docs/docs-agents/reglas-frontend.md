# Reglas de frontend

Propósito: definir los estándares de interfaz, listados, imágenes, rendimiento visual, accesibilidad, experiencia de uso, sistema de temas y cacheo en cliente que rigen todo el frontend del monorepo.

## Estándares generales de frontend

- Toda petición tiene estado de carga. Los botones de escritura se deshabilitan y muestran loading.
- Los efectos secundarios se limpian en el desmontaje. Las peticiones con alta probabilidad de desmontaje usan AbortController.
- Cada componente que consume datos resuelve tres estados: carga, error y éxito. El estado vacío reutiliza el componente global.
- Las eliminaciones usan modal de confirmación.
- Toast en cada try/catch. Prohibido usar alert, confirm y prompt.
- No se muestran errores internos al usuario.
- Las variables de entorno públicas usan el prefijo process.env.NEXT_PUBLIC_ (ver reglas-secretos.md).
- Los campos de contraseña tienen toggle de ojo, aria-label y son operables por teclado.
- La navbar tiene secciones y subsecciones, con un máximo de dos niveles. El estado activo usa aria-current="page" y más de un atributo visual.
- El diseño es responsive mobile-first. Las pruebas se hacen con viewport 390x600.
- Los componentes interactivos de DaisyUI (modal, dropdown, tabs, accordion, drawer, tooltip) requieren accesibilidad manual: aria-expanded, aria-controls, role, focus trap y operación por teclado.
- Las búsquedas usan debounce de 300 a 500 ms.
- Los listados con más de 100 ítems usan virtualización.
- Prohibido usar `any` y `as` para silenciar al compilador.
- Todo texto visible vive en archivos de traducción por módulo. common.json se reserva para textos compartidos. Prohibido el archivo monolítico. Se usan códigos BCP 47. Las fechas y los números se formatean con utilidades nativas de i18n. El detalle está en reglas-i18n.md.
- Los errores de validación se muestran debajo del input, con aria-describedby, aria-invalid y role="alert". La validación ocurre en onBlur y al enviar, mostrando todos los errores a la vez.
- Consultar siempre docs/docs-agents/design.md antes de tocar la interfaz.

## Listados

- Todo listado es paginable y admite búsqueda, filtros y ordenamiento.
- La búsqueda, los filtros y el ordenamiento se envían al backend y se resuelven en la sentencia de la base de datos. Prohibido traer colecciones completas a memoria para filtrar, ordenar o paginar en código de aplicación.
- El total de resultados se calcula en la base de datos, no en memoria.
- El estado de los listados vive en la URL (query params). Al cambiar filtros, la página se resetea a 1.
- Se muestra un indicador de filtros activos, el total de resultados y el rango visible.
- El estado vacío diferencia entre "no hay datos" y "sin resultados con esos filtros".

## Imágenes y rendimiento visual

- Imágenes comprimidas en formatos modernos (WebP, AVIF).
- Dimensiones correctas, lazy loading salvo para elementos above-the-fold y srcset responsive.
- La velocidad de carga se mide con Lighthouse. El objetivo mínimo es 90 en móvil.

## Accesibilidad

- Navegación operable con teclado y foco visible.
- Texto alternativo obligatorio en imágenes. Las decorativas usan alt vacío y las informativas usan alt descriptivo.
- Contraste WCAG AA: 4.5:1 para texto normal y 3:1 para texto grande y componentes de UI.
- ARIA correcto, con aria-label descriptivo en íconos sin texto.
- Los errores de validación son accesibles.

## UX y navegación de páginas

- Página 404 personalizada.
- Enlaces rotos verificados antes del cierre.
- Botón de WhatsApp visible solo si el proyecto lo usa.
- Una sola llamada a la acción por pantalla.

## Sistema de temas y modos

El proyecto tiene dos temas: tricking-light (default) y tricking-dark (prefersdark).

La resolución del tema sigue este orden:

1. Preferencia manual guardada en localStorage (clave tricking:theme).
2. Preferencia del sistema vía prefers-color-scheme.
3. Default del proyecto (modo claro).

Reglas:

- El tema se aplica con data-theme en el elemento html, nunca con clases condicionales.
- Prohibido escribir colores sueltos con hex en los componentes. Todo sale de las variables del tema.
- El script inline anti-flash vive en el head del layout raíz y es el único dangerouslySetInnerHTML permitido sin autorización expresa.
- El tema persistido usa la clave tricking:theme con TTL de 1 año.
- El cambio de tema es instantáneo, sin recargar la página.
- El botón de toggle tiene aria-label descriptivo, aria-pressed y es operable por teclado.

Las paletas completas de modo claro y oscuro, los colores semánticos, los colores por dificultad y los colores por categoría de truco viven en docs/docs-agents/design.md. No se duplican en este documento.

## Cacheo en cliente (localStorage)

Para reducir peticiones y ahorrar CPU time en Cloudflare Pages, se cachea en localStorage todo lo que no sea sensible.

Qué se cachea:

- Catálogo de trucos.
- Descripciones largas de Kojo.
- Preferencia de idioma.
- Última posición del scroll y filtros.
- URLs de vídeos de R2 con TTL corto.
- Resultados de búsqueda con TTL de 5 a 15 minutos.
- Estado expandido del acordeón con TTL de 7 días.
- Tema con TTL de 1 año.
- Tips de mirada con TTL de 30 días.

Qué no se cachea:

- Tokens de sesión (se usan cookies httpOnly).
- Datos sensibles de usuario.
- Estado del servidor en tiempo real.

Reglas:

- Toda lectura va envuelta en try/catch.
- Toda clave lleva el prefijo tricking: por módulo.
- Toda entrada con TTL guarda { value, expiresAt }.
- Prohibido guardar tokens, contraseñas o datos personales.
- Las escrituras usan un debounce mínimo de 300 ms.
- Si el dato está fresco, no se dispara la petición. Si está vencido, se sirve primero el dato cacheado (stale-while-revalidate) y se actualiza en background.
- El wrapper vive en packages/shared/src/storage.ts y valida al leer con Zod.
- Se usa el gestor de estado del repositorio (TanStack Query) con su mecanismo de persistencia. Prohibido acceder a localStorage, sessionStorage o IndexedDB directamente para estado de la aplicación. El wrapper de cacheo es la única puerta de entrada.
- Los datos rehidratados se validan contra su esquema.
- No se guardan secretos, tokens ni datos sensibles en el almacenamiento del navegador.

## Reglas transversales relacionadas

- Cookies y consentimiento: docs/docs-agents/reglas-cookies.md.
- Internacionalización: docs/docs-agents/reglas-i18n.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Seguridad: docs/docs-agents/reglas-seguridad.md.
- Decisiones visuales y paletas: docs/docs-agents/design.md.
