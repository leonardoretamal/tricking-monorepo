import { timingSafeEqual } from 'node:crypto';

import { logger } from './logger';

// Proteccion del panel de feedback con un token de administracion (Fase 18). Se usa
// mientras Auth.js no este activo. El token se compara en tiempo constante y nunca se
// registra en logs. Si la variable no esta configurada, el acceso se niega.

export const FEEDBACK_ADMIN_HEADER = 'x-feedback-admin-token';

function safeCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function readFeedbackAdminToken(request: Request): string | null {
  const header = request.headers.get(FEEDBACK_ADMIN_HEADER);
  if (header === null) {
    return null;
  }
  const trimmed = header.trim();
  return trimmed === '' ? null : trimmed;
}

export function isFeedbackAdmin(request: Request, traceId: string): boolean {
  const expected = process.env.FEEDBACK_ADMIN_TOKEN;
  if (expected === undefined || expected.trim() === '') {
    logger.warn(
      { traceId },
      'FEEDBACK_ADMIN_TOKEN no configurado: acceso al panel de feedback denegado',
    );
    return false;
  }
  const provided = readFeedbackAdminToken(request);
  if (provided === null) {
    return false;
  }
  return safeCompare(provided, expected);
}
