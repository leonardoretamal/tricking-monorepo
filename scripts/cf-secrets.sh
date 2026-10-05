#!/usr/bin/env bash
# Carga en Cloudflare Workers los secretos de RUNTIME del asistente, la base y el correo,
# leyendo los valores del .env local. No imprime los valores.
#
# Uso:
#   export CLOUDFLARE_API_TOKEN="tu-token"   # token con permiso de editar Workers
#   bash scripts/cf-secrets.sh
#
# Requiere que el worker ya exista (corre una vez `pnpm --filter @tricking/web cf:deploy`)
# o que el token pueda crearlo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/../apps/web" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
WORKER_NAME="aprender-tricking"

if [ ! -f "$ENV_FILE" ]; then
  echo "cf-secrets: falta $ENV_FILE"
  exit 1
fi
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "cf-secrets: define CLOUDFLARE_API_TOKEN en el entorno"
  exit 1
fi

KEYS=(
  DATABASE_URL
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  RESEND_API_KEY
  FEEDBACK_NOTIFY_EMAIL
  FEEDBACK_FROM_EMAIL
  FEEDBACK_ADMIN_TOKEN
  TURNSTILE_SECRET_KEY
  AI_GROQ_API_KEY
  AI_NVIDIA_API_KEY
  AI_OPENROUTER_API_KEY
  AI_DAILY_REQUEST_CAP
)

cd "$WEB_DIR"
for key in "${KEYS[@]}"; do
  value="$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//')"
  if [ -z "$value" ]; then
    echo "skip: $key (no esta en .env)"
    continue
  fi
  printf '%s' "$value" | pnpm exec wrangler secret put "$key" --name "$WORKER_NAME" >/dev/null
  echo "ok: $key"
done

echo "cf-secrets: listo. Recuerda definir NEXT_PUBLIC_SITE_URL y NEXT_PUBLIC_TURNSTILE_SITE_KEY como variables de build (GitHub Actions vars)."
