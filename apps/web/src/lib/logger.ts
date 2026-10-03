import pino from 'pino';

// Logger del backend (Pino). Nunca se registran datos sensibles ni errores crudos al
// cliente. El trace_id permite correlacionar una peticion con sus logs.

export const logger = pino({
  name: 'tricking-web',
  level: process.env.LOG_LEVEL ?? 'info',
});

export function newTraceId(): string {
  return globalThis.crypto.randomUUID();
}
