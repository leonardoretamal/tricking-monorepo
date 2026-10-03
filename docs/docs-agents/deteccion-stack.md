# Detección de stack, dependencias e infraestructura

Propósito: definir qué debe detectar y registrar el agente antes de crear o completar la documentación base de un repositorio, y dónde queda registrado. El resultado se vuelca en docs/docs-agents/stack-tecnico.md. Aplica al adoptar un repositorio existente y como checklist de arranque de uno nuevo.

## Modalidad según el estado del repositorio

- Repositorio nuevo, sin stack, dependencias ni infraestructura: el agente no se limita a preguntar. Propone recomendaciones concretas por cada categoría, con al menos una opción principal y una alternativa, y una justificación breve. Las presenta como propuesta, no como imposición. Si el usuario no responde, se toma la opción principal por defecto, se escribe en stack-tecnico.md y se anota que puede ajustarse. Las recomendaciones se basan en docs/docs-agents/recomendaciones-stack.md.
- Repositorio existente, con stack definido: se respeta lo existente y solo se registra. No se proponen cambios sin autorización.

## Tecnologías a registrar

- Lenguaje y framework del frontend.
- Lenguaje y framework del backend.
- Base de datos.
- ORM o query builder.
- Sistema de estilos.
- Gestor de estado del frontend, con su mecanismo de persistencia.
- Librería de i18n, si aplica.

## Dependencias a registrar

- Librerías de validación.
- Librerías de logging.
- Librerías de UI o componentes.
- Cliente HTTP.
- Librerías de test.
- Librerías de autenticación.
- Librerías de integración con IA, si aplica.
- Librería de analítica, si aplica.
- Librería de banner de cookies, si aplica.
- Cualquier dependencia declarada en package.json, requirements.txt, go.mod, composer.json, Cargo.toml o equivalente.

## Infraestructura a registrar

- Entorno de despliegue.
- Contenedores y orquestación.
- CI/CD.
- Almacenamiento de archivos.
- Caché.
- Colas o mensajería.
- Proveedor de correo.
- Proveedor de SMS.
- CDN.
- Gestión de secretos: si se usa un gestor, registrar modalidad, región, entornos configurados, método de autenticación en CI/CD, uso de Machine Identities y organización de secretos.
- Archivos .env y .env.example: ubicación, variantes por entorno, si están cubiertos por .gitignore, si .env.example está versionado y sincronizado.
- HTTPS forzado en servidor o CDN, dominio y certificados.

## Uso de IA

- En el producto: si el repositorio integra IA, proveedor, librerías de integración, modelos y para qué funcionalidad, si hay RAG, embeddings o vector store, y políticas de retención de datos del proveedor. Las reglas viven en docs/docs-agents/reglas-ia.md.
- Para desarrollo: skills instaladas con su propósito y cuándo se activan, agentes o subagentes configurados y reglas específicas de IA del repositorio.

## Internacionalización e idioma del repositorio

- Uso de i18n, librería, idiomas soportados, idioma base y ubicación de las traducciones.
- Idioma del código fuente, de los comentarios, de los mensajes de commit y de la documentación existentes.
- Idioma de los nombres de archivo, variable, función, clase y constante.
- Si no usa i18n: si hay textos visibles al usuario hardcodeados y en qué idioma están.

## Cookies y tecnologías similares

- Si el repositorio usa cookies o tecnologías similares.
- Categorías presentes: estrictamente necesarias, preferencias, analítica, marketing.
- Proveedores o SDKs de analítica y marketing.
- Si ya hay banner implementado y con qué librería.
- Si existe registro de consentimiento y dónde vive.

## Estrategia de listados

- Si la paginación, la búsqueda, los filtros y el ordenamiento se resuelven en la sentencia de la base de datos o en memoria.
- Si el backend trae colecciones completas a memoria en algún punto. Marcar cada caso como correcto o pendiente de corrección.
- Si hay índices en las columnas usadas en WHERE, ORDER BY y JOIN de consultas frecuentes.
- Si se verifica el plan de ejecución en consultas críticas.
- Si el total se calcula en la base de datos o en memoria.
- Si hay paginación del servidor o del cliente.
- Si el estado de búsqueda y filtros se persiste en la URL.

## Persistencia del lado del cliente

- Gestor de estado y su mecanismo de persistencia.
- Si se usa localStorage, sessionStorage o IndexedDB directamente en alguna parte del código.
- Si los datos rehidratados se validan contra un esquema.
- Si hay tokens, credenciales o datos sensibles en el almacenamiento del navegador. Marcar como pendiente de corrección si los hay.

## Infraestructura local de pruebas

- Comandos para levantar el entorno local (docker compose up, scripts, Makefile).
- Si hay seeds, fixtures o datos de prueba.
- Si hay un archivo de Docker Compose para desarrollo local.
- Si los tests de integración requieren infraestructura y cómo se levanta.

## SEO, accesibilidad, legal y lanzamiento

- SEO: meta títulos y descripciones por página, datos estructurados, sitemap.xml y robots.txt, favicon, texto alternativo, imágenes comprimidas, Lighthouse, contraste WCAG AA, página 404, enlaces rotos.
- Legal: aviso legal, política de privacidad, aviso de cookies y registro de aceptación de la política.
- Estado de lanzamiento: si está en producción, staging o desarrollo; si hay checklist de lanzamiento documentado; si hubo auditoría previa.

## Monorepo

- Si el repositorio es un monorepo, registrar la estructura de servicios o módulos.
- Cada servicio puede tener su propio package.json, requirements.txt, go.mod, composer.json o equivalente, su propio .infisical.json, su propio .env.example y su propia suite de tests, linter y formateador.
- La documentación base y los documentos referenciados se organizan por servicio o de forma transversal, según la convención del repositorio.
- AGENTS.md raíz cubre todo el monorepo. Si los servicios tienen stacks muy distintos o equipos independientes, cada servicio puede tener su propio AGENTS.md, referenciado desde el raíz.
- BITACORA.md es único en la raíz, sin fragmentar por servicio.

## Uso de lo detectado

Con esa información se activan únicamente las reglas condicionales aplicables. Si el repositorio ya tiene una librería que resuelve un problema (validación, logging, test, HTTP, IA, estado, persistencia), se usa esa y no se propone una nueva sin autorización.

## Reglas transversales relacionadas

- Inventario y decisiones: docs/docs-agents/stack-tecnico.md.
- Opciones comparadas: docs/docs-agents/recomendaciones-stack.md.
- IA: docs/docs-agents/reglas-ia.md.
