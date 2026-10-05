import { describe, expect, it } from 'vitest';

import { feedbackFormSchema, feedbackQuerySchema, sanitizeMessage } from './feedback-schemas';

function validPayload() {
  return {
    type: 'sugerencia' as const,
    name: '',
    email: '',
    message: 'Un mensaje de prueba suficientemente largo.',
    page: '/es/feedback',
    locale: 'es' as const,
    honeypot: '',
    formStartedAt: 1_000,
    turnstileToken: '',
  };
}

describe('feedbackFormSchema', () => {
  it('acepta un cuerpo valido', () => {
    const parsed = feedbackFormSchema.safeParse(validPayload());
    expect(parsed.success).toBe(true);
  });

  it('rechaza un mensaje vacio', () => {
    const result = feedbackFormSchema.safeParse({ ...validPayload(), message: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza un mensaje que queda corto tras sanear el HTML', () => {
    const result = feedbackFormSchema.safeParse({
      ...validPayload(),
      message: '<b>hola</b>',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza un correo invalido', () => {
    const result = feedbackFormSchema.safeParse({ ...validPayload(), email: 'no-es-correo' });
    expect(result.success).toBe(false);
  });

  it('rechaza el honeypot lleno', () => {
    const result = feedbackFormSchema.safeParse({ ...validPayload(), honeypot: 'spam' });
    expect(result.success).toBe(false);
  });

  it('rechaza un tipo desconocido', () => {
    const result = feedbackFormSchema.safeParse({ ...validPayload(), type: 'otro-tipo' });
    expect(result.success).toBe(false);
  });

  it('sanitiza el mensaje quitando etiquetas y scripts', () => {
    const parsed = feedbackFormSchema.parse({
      ...validPayload(),
      message: '<script>alert(1)</script>Mensaje limpio del usuario.',
    });
    expect(parsed.message).toBe('Mensaje limpio del usuario.');
  });
});

describe('sanitizeMessage', () => {
  it('quita las etiquetas y conserva el texto', () => {
    expect(sanitizeMessage('<b>hola</b> mundo')).toBe('hola mundo');
  });
});

describe('feedbackQuerySchema', () => {
  it('aplica los valores por defecto', () => {
    const parsed = feedbackQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBeGreaterThan(0);
  });

  it('rechaza page=0 y pageSize fuera de rango', () => {
    expect(feedbackQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(feedbackQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it('rechaza un estado desconocido', () => {
    expect(feedbackQuerySchema.safeParse({ status: 'inventado' }).success).toBe(false);
  });
});
