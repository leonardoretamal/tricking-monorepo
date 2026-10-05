import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Configuracion de OpenNext para Cloudflare Workers. Sin cache incremental externo por
// ahora (se puede agregar R2/KV mas adelante). El despliegue y los secretos se manejan
// con wrangler y el workflow de GitHub Actions.
export default defineCloudflareConfig();
