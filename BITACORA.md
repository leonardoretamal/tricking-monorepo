# BITACORA

Este archivo se rellena a medida que se trabaja en issues y tasks. Cada entrada se agrega en orden cronológico con su encabezado correspondiente.

## Fase 0: Fundaciones (2026-10-03)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Fundaciones del monorepo (subfases 0.1 a 0.7).
- Qué pedía: arrancar el monorepo desde cero con el esqueleto de Turborepo y pnpm, el tooling de calidad, la documentación base, las reglas fragmentadas, los templates de GitHub, el launcher y Playwright para E2E.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada, pendiente el cierre formal.
- Autor del registro: Leonardo Retamal.
- Acciones: se creó el workspace `@tricking/*`; se configuró TypeScript estricto, ESLint, Prettier, Husky, lint-staged y commitlint; se crearon `AGENTS.md`, `README.md`, `BITACORA.md` y los documentos de `docs/docs-agents/`; se fragmentaron las reglas; se crearon los templates de PR e issues y el workflow mínimo de CI; se verificó `bin/lupe-start`; se configuró Vitest y Playwright con viewport móvil 390x600.
- Archivos tocados: `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `.npmrc`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `commitlint.config.cjs`, `.lintstagedrc.json`, `.husky/`, `vitest.config.ts`, `playwright.config.ts`, `e2e/`, `AGENTS.md`, `README.md`, `docs/docs-agents/*.md`, `.github/**`, `.gitignore`.
- Comandos relevantes: `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm exec prettier --check .`, `pnpm exec playwright test --list`, `shellcheck bin/lupe-start`.
- Pruebas: build de producción (vacío) en verde; lint, typecheck, test y formato en verde; hooks de git funcionando; Playwright lista dos pruebas (chromium y mobile).
- Decisiones: no hay gitflow, los commits y el push van directos a `main`; el workflow `ci.yml` se creó en la subfase 0.5 y `migrate.yml` queda diferido a la Fase 1.7; los paquetes usan el alcance `@tricking/*`.
- Pendientes y riesgos: los navegadores de Playwright no se instalaron (se hace en la Fase 2); las etiquetas `bug`, `feature` y `tarea` deben crearse en GitHub; el `.env.example` se creará con la primera variable en la Fase 1.
- Referencias: `docs/docs-agents/fases.md`, `AGENTS.md`, commits `ceab9da`, `6e1cd74`, `827f832`, `5cb7b83`.

## Fase 18: Feedback de usuarios (2026-10-03)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Registro de la Fase 18 (feedback de usuarios).
- Qué pedía: dejar constancia de que el feedback de usuarios (formulario, mini dashboard y aviso por correo) se programó como fase nueva.
- Fecha de inicio: 2026-10-03.
- Estado actual: pendiente.
- Autor del registro: Leonardo Retamal.
- Acciones: se agregó la Fase 18 con sus subfases 18.1 a 18.11 en `docs/docs-agents/fases.md` y se referenció en la sección 28.5 de `AGENTS.md`.
- Decisiones: el aviso por correo usa Resend y se activa en esta fase; el panel administrativo se protege con token o con Auth.js según disponibilidad.
- Pendientes y riesgos: la protección del panel y el orden respecto de la Fase 17 se deciden al implementar.
- Referencias: `docs/docs-agents/fases.md`, `AGENTS.md` sección 28.5.
