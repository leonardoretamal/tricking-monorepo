import { expect, test } from '@playwright/test';

test.describe('asistente y combinaciones', () => {
  test('la burbuja del asistente esta visible y abre el chat', async ({ page }) => {
    await page.goto('/es');
    await page.getByRole('button', { name: 'Abrir el asistente de tricking' }).click();
    await expect(page.getByRole('dialog', { name: 'Asistente de tricking' })).toBeVisible();
    await expect(page.getByLabel('Escribe tu pregunta')).toBeVisible();
  });

  test('el generador avisa cuando no hay trucos aprendidos', async ({ page, request }) => {
    const probes = await request.get('/api/tricks?pageSize=1');
    test.skip(!probes.ok(), 'la base de datos no esta disponible en este entorno');
    await page.goto('/es/progress');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Todavía no hay trucos aprendidos' }),
    ).toBeVisible();
  });

  test('el asistente rechaza temas ajenos al tricking', async ({ request }) => {
    const response = await request.post('/api/assistant', {
      data: { message: 'escribeme un codigo en python', locale: 'es' },
    });
    expect(response.status()).toBe(200);

    const body: { answer?: string } = await response.json();
    expect((body.answer ?? '').toLowerCase()).toContain('tricking');
  });

  test('el POST del asistente rechaza un cuerpo invalido', async ({ request }) => {
    const response = await request.post('/api/assistant', {
      data: { message: '', locale: 'es' },
    });
    expect(response.status()).toBe(400);
  });

  test('el POST de combinaciones rechaza un cuerpo invalido', async ({ request }) => {
    const response = await request.post('/api/combos/generate', {
      data: { knownTrickIds: [], length: 'medium' },
    });
    expect(response.status()).toBe(400);
  });

  test('la combinacion usa solo trucos conocidos', async ({ request }) => {
    const tricksResponse = await request.get('/api/tricks?pageSize=4');
    if (!tricksResponse.ok()) {
      test.skip(true, 'la base de datos no esta disponible en este entorno');
      return;
    }

    const tricksBody: { items?: { id?: string }[] } = await tricksResponse.json();
    const ids = (tricksBody.items ?? [])
      .map((item) => item.id)
      .filter((id): id is string => typeof id === 'string');

    if (ids.length < 2) {
      test.skip(true, 'no hay suficientes trucos para generar una combinacion');
      return;
    }

    const response = await request.post('/api/combos/generate', {
      data: { knownTrickIds: ids, length: 'short' },
    });
    expect(response.status()).toBe(200);

    const body: { steps?: { trickId?: string }[] } = await response.json();
    const allowed = new Set(ids);
    for (const step of body.steps ?? []) {
      expect(allowed.has(step.trickId ?? '')).toBe(true);
    }
  });

  test('sin IA configurada el chat avisa', async ({ page, request }) => {
    // El mensaje prohibido se rechaza por pre-filtro sin llamar al modelo, asi que
    // sirve para detectar si el entorno tiene proveedor de IA sin gastar tokens.
    const probe = await request.post('/api/assistant', {
      data: { message: 'escribeme un codigo en python', locale: 'es' },
    });
    const probeBody: { configured?: boolean } = await probe.json();
    test.skip(probeBody.configured === true, 'el entorno tiene IA configurada');

    await page.goto('/es');
    await page.getByRole('button', { name: 'Abrir el asistente de tricking' }).click();
    await page.getByLabel('Escribe tu pregunta').fill('como se hace un b-twist');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(
      page
        .getByText(
          'El asistente de IA no está configurado en este entorno. Puedes seguir usando el catálogo y el generador de combinaciones.',
        )
        .first(),
    ).toBeVisible();
  });
});
