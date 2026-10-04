import { expect, test } from '@playwright/test';

// Fase 14: reproductor de video del detalle de truco. Las pruebas no requieren que R2
// este configurado: el endpoint responde igual (con videos externos o vacio) y la seccion
// del reproductor siempre se monta.

test.describe('video de trucos', () => {
  test('el endpoint de videos exige trickId', async ({ request }) => {
    const response = await request.get('/api/videos');
    expect(response.status()).toBe(400);
  });

  test('el endpoint de videos responde una lista para un truco real', async ({ request }) => {
    const tricksResponse = await request.get('/api/tricks?section=backward&pageSize=1');
    expect(tricksResponse.status()).toBe(200);

    const tricksBody = (await tricksResponse.json()) as { items: { id: string }[] };
    const first = tricksBody.items[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      return;
    }

    const response = await request.get(`/api/videos?trickId=${encodeURIComponent(first.id)}`);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      items: { id: number; url: string; source: string }[];
    };
    expect(Array.isArray(body.items)).toBe(true);
  });

  test('el detalle de un truco muestra la seccion del reproductor', async ({ page }) => {
    await page.goto('/es/tricks/backward');
    await page.locator('a[href*="/tricks/backward/"]').first().click();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Video demostrativo' })).toBeVisible();
  });
});
