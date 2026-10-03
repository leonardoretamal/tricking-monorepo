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

## Reglas transversales relacionadas

- Git y espera de checks: docs/docs-agents/reglas-git.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Validación al cierre: docs/docs-agents/reglas-validacion.md.
