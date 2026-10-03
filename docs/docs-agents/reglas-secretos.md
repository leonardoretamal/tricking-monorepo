# Reglas de secretos y .env.example (transversal)

Propósito: definir el manejo de credenciales y variables de entorno, la sincronización obligatoria de .env.example y las condiciones para escribir secretos por CLI o API.

Estas reglas aplican tanto al frontend como al backend.

## Reglas base

- Ninguna credencial en código. Todo se maneja por variables de entorno.
- .env.example está versionado. Los archivos .env y sus variantes con valores reales están en .gitignore.
- Cada vez que se agrega, renombra o elimina una variable de entorno en el código, se refleja el cambio en el .env.example correspondiente en la misma tarea.
- Cada variable lleva nombre, valor de ejemplo no real o vacío, y un comentario breve.
- Nunca se escribe el valor real de un secreto. Se usan placeholders como your-secret-here o change-me.
- Si el repositorio no tiene .env.example, se crea al agregar la primera variable.
- El cambio del .env.example va en la misma rama del issue.
- Las variables del frontend (NEXT_PUBLIC_*) están sujetas a las mismas reglas.

## Gestión con gestores externos

Gestores considerados: Infisical, Vault, AWS Secrets Manager, GCP, Azure, Doppler, 1Password, Bitwarden, SOPS y sealed-secrets. La recomendación principal es usar variables de entorno en GitHub Actions y Cloudflare, y evaluar un gestor externo solo si el proyecto crece.

Reglas de uso:

- Inyección en runtime, nunca hardcodeo ni .env versionado.
- Autenticación no interactiva con Universal Auth o Machine Identity.
- CI/CD con OIDC preferido, o Universal Auth con secretos en GitHub Secrets.
- Producción: Machine Identities con permisos mínimos, solo lectura.
- Organización con --path, --recursive y --project-config-dir en monorepos.
- El archivo de configuración del gestor no contiene secretos y se puede commitear.
- Rotación: cambiar, redesplegar y verificar.
- Nunca inventar comandos. Consultar la documentación oficial si hay duda.

## Autorización para escribir secretos por CLI o API

- Condición previa: solo si AGENTS.md o stack-tecnico.md confirman el gestor.
- Alcance: únicamente el entorno dev. Prohibido staging, prod, qa o uat.
- Nunca se imprime el valor real en chat, logs, bitácora ni PR. Solo se informa el nombre y el propósito.
- Se refleja la variable en el .env.example correspondiente.
- Se deja constancia en la bitácora y en el body del PR.
- Si no hay credenciales de escritura, se reporta y se deja la mini-guía.

## Mini-guía obligatoria

Cuando se agrega una variable se documenta una mini-guía con:

- Nombre.
- Para qué sirve.
- Si es obligatoria u opcional.
- Valor por defecto.
- Cómo configurarla en cada entorno.

## Verificación

- El subagente reviewer verifica esta sincronización al cierre.
- El subagente security revisa la exposición de secretos, la ausencia de secretos en localStorage y la ausencia de escritura en entornos que no sean dev.

## Reglas transversales relacionadas

- Seguridad: docs/docs-agents/reglas-seguridad.md.
- Backend: docs/docs-agents/reglas-backend.md.
- Frontend: docs/docs-agents/reglas-frontend.md.
- Git: docs/docs-agents/reglas-git.md.
- Validación al cierre: docs/docs-agents/reglas-validacion.md.
