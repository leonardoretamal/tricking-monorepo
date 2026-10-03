# Reglas de backend

Propósito: definir los estándares de validación, manejo de errores, consultas, listados, endpoints, migraciones y arquitectura que rigen todo el backend del monorepo.

## Validación de entradas

- Validar body, params y query con Zod antes de tocar la lógica o la base de datos.
- Validación estricta de los parámetros de listados.
- Lista blanca de campos permitidos.
- Índices en las columnas usadas.
- Plan de ejecución revisado en las consultas críticas.

## Manejo de errores y respuestas

- try/catch en las operaciones importantes.
- Códigos HTTP correctos.
- Middleware centralizado.
- No se devuelven errores internos crudos al cliente.

## Consultas y base de datos

- Prohibida la concatenación de strings en consultas.
- Transacciones en operaciones que tocan varias tablas.
- Carga anticipada para evitar el problema N+1.
- Soft delete por defecto en entidades con relaciones o auditoría. Hard delete solo para datos temporales.
- Migraciones versionadas con avance y reversión.
- Fechas en UTC.
- Sin float para dinero.

## Listados

- La paginación, la búsqueda, los filtros y el ordenamiento se resuelven en la sentencia de la base de datos. Prohibido filtrar, ordenar o paginar en código de aplicación.
- El total de resultados se calcula en la base de datos.

## Seguridad de endpoints

- Idempotencia y rate limiting en los endpoints de escritura y de autenticación.
- CORS con orígenes explícitos. Prohibido el comodín en producción.
- Formularios protegidos contra spam: honeypot, validación de tiempo mínimo de llenado y captcha o Turnstile en formularios públicos. El captcha se resuelve en el servidor.
- Las credenciales se manejan solo por variables de entorno. El detalle está en reglas-secretos.md.

## Carga de archivos

- Validar el MIME real, el tamaño y el nombre sanitizado en los uploads.

## Arquitectura

- Arquitectura asíncrona con async/await y try/catch.

## Variantes de paginación por motor

- SQL relacional (PostgreSQL en Neon): SELECT con WHERE, ORDER BY, LIMIT y OFFSET dentro de la sentencia. Cuando el conjunto es grande, paginación por cursores con WHERE (columna, id) < (valor, id) ORDER BY columna, id LIMIT n.
- ORM y query builder: usar los métodos nativos que se traducen a la sentencia. Con Drizzle: .where(), .orderBy(), .limit(), .offset() y el conteo con count(). Prohibido cargar la colección completa y filtrar, ordenar o paginar en código de aplicación.
- MongoDB (si algún servicio lo usa): aggregation pipeline con $match, $sort, $skip y $limit, y $facet cuando se necesita el total y la página en una sola pasada.

## Metadatos de paginación y cursores

- La respuesta paginada incluye el total de registros, la página actual, el tamaño de página y el total de páginas, o el cursor siguiente y anterior.
- El tamaño de página tiene un máximo configurable; el cliente no puede pedir más registros que ese máximo.
- La paginación por cursores se prefiere cuando el conjunto es grande, cambia con frecuencia o se ordena por columnas no únicas.
- Cuando el conjunto es muy grande y el COUNT(*) exacto es costoso, se permite un total aproximado o un "hay más resultados" con cursor siguiente; la decisión se documenta y se justifica.

## Borrado: verificaciones previas

Antes de eliminar un recurso, el backend verifica en este orden:

- Existencia (404).
- Autorización (403).
- Integridad referencial (409 o cascada autorizada).
- Estado e idempotencia.
- El backend nunca confía en la confirmación del frontend como sustituto de sus validaciones.

## Datos simulados y datos de prueba

- Prohibido insertar respuestas simuladas o datos estáticos para evadir fallas de infraestructura local.
- La prohibición anterior no aplica a los datos de prueba controlados (fixtures, seeds, mocks) usados para verificar un cambio. La diferencia es la intención: si el agente no puede levantar la base de datos y en su lugar hardcodea la respuesta del endpoint, está prohibido; si levanta la base de datos, la llena con datos de prueba y verifica el endpoint, está permitido.

## Arquitectura modular

- Un módulo, servicio o carpeta de backend con demasiadas responsabilidades se divide en submódulos o subcarpetas por dominio.
- No se acumulan controladores, servicios y modelos de dominios distintos en un mismo archivo.

## Registro y validación de cuenta

Aplica cuando el proyecto tenga registro de usuarios.

- Todo registro se valida por al menos un canal antes de habilitar la cuenta.
- Flujo: recibir y validar estrictamente los datos, verificar duplicado (409), crear la cuenta no validada, generar un token con expiración y almacenarlo hasheado, enviar el código por el canal y devolver una respuesta exitosa sin revelar si el correo ya existía.
- Verificación: recibir identificador y código, validar contra el hash, marcar la cuenta como validada y devolver 400 genérico si falla.
- Reenvío: rate limiting estricto, generar un código nuevo e invalidar el anterior, y devolver respuesta exitosa sin confirmar si el identificador existe.
- Seguridad: el código nunca se devuelve ni se registra en logs; el token se almacena hasheado; los intentos con código incorrecto se limitan; el login devuelve 403 mientras la cuenta no esté validada; la eliminación respeta la política de soft delete o hard delete.

## Login, recuperación de contraseña y sesiones

Aplica cuando el proyecto tenga registro de usuarios.

- Login: email o teléfono y contraseña, rate limiting, 403 si la cuenta no está validada, comparación contra el hashing del repositorio, emisión de sesión o token según el mecanismo del repositorio y logs sin credenciales.
- Recuperar contraseña: token con expiración de 15 a 60 minutos, almacenado hasheado, enviado por el canal, con respuesta que no revela si el identificador existe y con rate limiting.
- Reset: validar el token y su expiración, validar la contraseña nueva, actualizar el hash, invalidar el token usado, invalidar las sesiones activas y notificar por correo.
- Logout: invalidar el token o la lista negra según el mecanismo del repositorio.
- Gestión de sesiones: listado con dispositivo, IP y fechas, cierre individual y cierre de todas.

## Eliminación de cuenta

Aplica cuando el proyecto tenga registro de usuarios.

- Doble confirmación (correo, contraseña o código).
- Aviso de qué se borra y qué no se recupera, con opción de exportar los datos antes.
- Cascada: se borran todos los datos asociados (perfil, preferencias, contenido, relaciones, tokens, sesiones, notificaciones y archivos).
- Hard delete para los datos personales; los datos que la ley obliga a conservar quedan anonimizados o seudonimizados con base legal.
- Idempotente: repetir la eliminación no falla ni duplica efectos.
- Log de la eliminación sin datos personales.

## Reglas transversales relacionadas

- Seguridad: docs/docs-agents/reglas-seguridad.md.
- Logs: docs/docs-agents/reglas-logs.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Cookies y consentimiento: docs/docs-agents/reglas-cookies.md.
