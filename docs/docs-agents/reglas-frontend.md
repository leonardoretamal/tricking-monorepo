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

## Carga inicial y esqueletos

- Si la app tiene inicio de sesión o una carga inicial pesada, se muestra una pantalla visual atractiva y coherente con el design system mientras los datos cargan en segundo plano. No bloquea, entretiene. Al terminar, transición suave a la vista final. Prohibidas las pantallas de "cargando" vacías o con spinner seco cuando se puede mostrar algo visualmente agradable.
- Al cambiar de sección o vista que carga datos, se usan loadings de esqueleto (skeleton screens) en lugar de spinners genéricos. El esqueleto refleja la estructura aproximada del contenido (tarjetas, listas, tablas, bloques de texto) y se reutiliza el componente de skeleton existente antes de crear uno nuevo.
- El esqueleto se muestra hasta que llegan los datos, con un timeout máximo para no quedar colgado. No se usa skeleton para acciones puntuales (guardar, eliminar): para esas se usa loading en el botón.
- La app es asíncrona: nada bloquea la interfaz y toda petición tiene estado de carga.

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
- Tips de técnica de Kojo.
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

## Ciclo de vida y limpieza de efectos

Todo efecto secundario (temporizadores, escuchas de eventos, suscripciones, observadores) se limpia en el desmontaje. La forma depende del framework:

- React: retornar la función de limpieza desde useEffect.
- Vue: usar onUnmounted o el hook equivalente.
- Angular: implementar OnDestroy y desuscribirse con takeUntil o Subscription.unsubscribe.
- Svelte: retornar la función de limpieza desde onMount.
- Flutter: cancelar StreamSubscription y Timer en dispose.

Las peticiones HTTP lanzadas desde componentes con alta probabilidad de desmontaje incorporan un abortador:

- JavaScript nativo: AbortController.
- Axios: la señal signal con AbortController.
- Angular: HttpClient ya cancela suscripciones; se usa takeUntil para las composiciones.

## Campos de contraseña

- Todo campo de contraseña lleva un ícono de ojo al final del input para alternar entre mostrar y ocultar.
- El estado por defecto es oculto (type="password"). Cada clic alterna entre oculto y visible (type="text").
- El ícono refleja el estado actual: ojo abierto cuando el valor está visible, ojo cerrado o tachado cuando está oculto.
- El ícono es accesible: aria-label descriptivo, operable por teclado y con área de clic suficiente.
- El cambio de visibilidad no altera el valor del campo ni dispara validaciones adicionales.
- En formularios con más de un campo de contraseña, cada campo tiene su propio toggle independiente.

## Navegación y subsecciones

- La navegación principal se organiza en secciones de primer nivel. La profundidad máxima es de dos niveles (sección y subsección). Si hace falta un tercer nivel, se replantea la arquitectura de la interfaz.
- Cuando un módulo acumula muchas funcionalidades, vistas o campos, se divide en subsecciones. Criterio orientativo: más de cinco o seis ítems de primer nivel o scroll excesivo.
- Las subsecciones se muestran de forma consistente en todo el proyecto (tabs, sidebar secundario, menú desplegable o breadcrumbs), según lo que ya use el repositorio. No se mezclan patrones.
- El ítem activo se marca con las utilidades del router (NavLink en React Router, routerLinkActive en Angular, useRoute en Vue Router, active-class en Nuxt), no comparando la URL a mano.
- El estado activo se distingue por más de un atributo visual (color, peso de fuente, borde, fondo o ícono) e incluye aria-current="page".
- En móvil la navegación se colapsa en menú hamburguesa o barra inferior, según el patrón del repositorio, y el estado activo sigue visible.
- La navegación es operable con teclado, con foco visible, y los íconos sin texto llevan aria-label descriptivo.

## Modularidad de componentes

- Los componentes no se llenan de cientos o miles de líneas.
- Se usa una arquitectura de componente padre, componentes hijos y nietos, con responsabilidades atómicas.

## Errores de validación en formularios

- Todo error de validación se muestra al usuario; nunca se oculta ni se silencia.
- Ubicación: debajo del input correspondiente. Nunca en un bloque genérico al final del formulario, nunca solo en un toast, nunca en una alerta nativa.
- Apariencia: color de error del design system, con el borde del input también en color de error mientras el campo sea inválido y contraste WCAG AA.
- Momento: se valida el campo al salir (onBlur); al enviar se validan todos y se muestran todos los errores a la vez; mientras se escribe (onChange) se limpia el error del campo cuando el valor deja de ser inválido.
- Mensajes específicos por tipo de error (requerido, formato, longitud, confirmación que no coincide, fuera de rango), no genéricos.
- Accesibilidad: aria-describedby apuntando al id del mensaje, aria-invalid="true" mientras esté inválido y anuncio con role="alert" o aria-live. El color no es el único indicador.
- No se desplaza el layout al aparecer el mensaje.
- Si el backend devuelve errores por campo, se muestran igual que los del cliente.
- Prohibido alert, confirm y prompt nativos; prohibido usar solo un toast para errores de campo; prohibido exponer mensajes técnicos crudos.
- Los mensajes y las reglas del frontend coinciden con los del backend.

## Registro y validación de cuenta

Aplica cuando el proyecto tenga registro de usuarios.

- El formulario de registro indica de forma clara y previa el canal de validación (correo electrónico o número telefónico).
- Tras enviar el registro, se muestra una pantalla o mensaje que pide revisar el canal elegido.
- La pantalla de validación incluye el campo para el código, un botón de reenvío con espera de 30 a 60 segundos y un enlace para corregir el correo o el número.
- Mientras la cuenta no esté validada, se muestra un aviso persistente y se evita el acceso a funcionalidades restringidas.
- Nunca se muestra en la interfaz el código de validación ni los detalles del token.
- Los campos de contraseña del registro cumplen la regla de campos de contraseña.

## Seguridad en el cliente

- Nunca se exponen URLs sensibles en el frontend ni se hardcodean tokens, claves, secretos o endpoints privados.
- Las variables de entorno públicas usan process.env.NEXT_PUBLIC_ en Next.js. El detalle está en reglas-secretos.md.
- Prohibido inyectar HTML sin sanitización previa (innerHTML, dangerouslySetInnerHTML, v-html, bypassSecurityTrustHtml) sin una librería dedicada.
- La validación del cliente es para experiencia de usuario y nunca sustituye la validación del servidor.
- Prohibido guardar tokens, credenciales, contraseñas, llaves privadas o datos personales sensibles en localStorage, sessionStorage o IndexedDB.
- El frontend consume datos reales de la base de datos a través del backend. Prohibido mostrar datos simulados o hardcodeados en producción como sustituto de una integración no terminada.

## Persistencia y SSR

- El gestor de estado del repositorio (TanStack Query) es la fuente única de verdad durante la sesión. El almacenamiento del navegador es solo la copia de respaldo que sobrevive al cierre.
- Prohibido guardar el mismo dato en dos lugares a la vez.
- Excepciones justificadas para usar localStorage directo: datos que no requieren reactividad y se leen una sola vez al iniciar, o preferencias que una librería externa lee directamente. En todos los casos, con try/catch y validación del dato leído.
- Al rehidratar, se valida el contenido contra un esquema (Zod) y se maneja el dato ausente, corrupto, de versión antigua o manipulado. Los gestores con versionado y migrate lo usan.
- El estado derivado, el estado transitorio de UI (modales, loaders) y los datos recalculables no se persisten.
- Los datos que superan el límite práctico de localStorage (cerca de 5 MB por origen) o que requieren lectura y escritura frecuente van a IndexedDB.
- SSR: nunca se lee almacenamiento del navegador a nivel de módulo ni durante el renderizado del servidor. Las lecturas van dentro de useEffect, de un inicializador perezoso o del mecanismo del gestor de estado.
- Toda escritura en almacenamiento se envuelve en try/catch y se degrada con gracia (modo privado, iframes, cuota superada).

## Reglas transversales relacionadas

- Cookies y consentimiento: docs/docs-agents/reglas-cookies.md.
- Internacionalización: docs/docs-agents/reglas-i18n.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Seguridad: docs/docs-agents/reglas-seguridad.md.
- Decisiones visuales y paletas: docs/docs-agents/design.md.
