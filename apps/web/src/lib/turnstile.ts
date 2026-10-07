import { z } from 'zod';

import { logger } from './logger';

// Verificacion de Cloudflare Turnstile resuelta en el servidor (Fase 18). Si falta la
// clave secreta, se degrada con aviso en logs y no se bloquea el guardado. Nunca se
// registra el token ni la clave.

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Tope defensivo para la verificacion remota: si Cloudflare no responde, la peticion
// se aborta y el catch de abajo bloquea el envio; asi el handler no queda esperando
// hasta que workerd lo cancele.
const TURNSTILE_TIMEOUT_MS = 5000;

const turnstileResponseSchema = z.object({
  success: z.boolean().optional(),
});

export type TurnstileVerification =
  { blocked: false; configured: boolean } | { blocked: true; configured: true };

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string | null,
): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret === undefined || secret === '') {
    logger.warn('Turnstile no configurado: se omite la verificacion del captcha');
    return { blocked: false, configured: false };
  }

  if (token === undefined || token === '') {
    return { blocked: true, configured: true };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp !== null && remoteIp !== '') {
    body.set('remoteip', remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { blocked: true, configured: true };
    }
    const parsed = turnstileResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { blocked: true, configured: true };
    }
    return { blocked: parsed.data.success !== true, configured: true };
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : 'unknown' },
      'Turnstile: fallo la verificacion remota, se bloquea el envio',
    );
    return { blocked: true, configured: true };
  }
}
