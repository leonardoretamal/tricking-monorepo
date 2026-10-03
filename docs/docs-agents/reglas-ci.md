# Reglas de CI

Propósito: definir la plataforma de integración continua, los workflows, los jobs típicos y las convenciones de acciones y caché del monorepo.

## Plataforma y workflows

- La plataforma es GitHub Actions.
- Los workflows viven en .github/workflows/ci.yml y .github/workflows/migrate.yml.

## Jobs típicos

- Lint + Format + Build.
- ShellCheck.
- Unit Tests.
- Integration Tests.
- i18n Key Validation.
- Migraciones Drizzle contra Neon.

## Convenciones de acciones y caché

- Se usan acciones oficiales versionadas.
- La caché de dependencias está habilitada.

## Workflow de migraciones

- El workflow migrate.yml se dispara cuando cambian packages/db/src/schema.ts o los archivos bajo packages/db/drizzle/**.
- Ejecuta el comando pnpm turbo db:migrate --filter=@tricking/db.
- Usa el secret DATABASE_URL.

## Disparadores

- push y pull_request hacia la rama principal. Opcional: workflow_dispatch.

## Activación condicional de jobs

- if: hashFiles('ruta/archivo') != '' para verificar la existencia de un archivo antes de correr un job.
- continue-on-error: true cuando el job debe correr pero no debe bloquear.
- Un job sin configurar se deja comentado con una nota # TODO.

## Jobs adicionales del catálogo

- ShellCheck si hay archivos .sh.
- Docker stack lint si existe docker-stack.yml o docker-compose.yml.
- Tests por microservicio con strategy: matrix si es monorepo.
- Cobertura de seguridad si hay script.
- Validación de configuraciones específicas.
- Cada job lleva una línea de comentario en el YAML que explica qué hace.

## Acciones oficiales versionadas

- actions/checkout@v4.
- actions/setup-node@v4 (Node).
- actions/setup-python@v5 (Python).
- actions/setup-go@v5 (Go).
- actions/setup-java@v4 (Java).
- Se usa caché de dependencias en el setup y matrices cuando hay repetición.
- El pipeline no reemplaza los ganchos locales.
- La espera de los checks se hace con gh pr checks --watch o el equivalente, nunca con sleep fijo.

## Reglas transversales relacionadas

- Git y espera de checks: docs/docs-agents/reglas-git.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Validación al cierre: docs/docs-agents/reglas-validacion.md.
