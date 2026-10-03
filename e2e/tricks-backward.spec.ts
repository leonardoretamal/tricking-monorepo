import { expect, test } from '@playwright/test';

test.describe('seccion backward', () => {
  test('el API de backward responde paginado con el total de la seccion', async ({ request }) => {
    const response = await request.get('/api/tricks?section=backward&pageSize=1');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(200);
    expect(body.items).toHaveLength(1);
  });

  test('backward lista trucos y muestra la paginacion', async ({ page }) => {
    await page.goto('/es/tricks/backward');
    await expect(page.getByRole('heading', { level: 1, name: 'Backward' })).toBeVisible();
    await expect(page.locator('a[href*="/tricks/backward/"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible();
  });

  test('abre el detalle de un truco de backward', async ({ page }) => {
    await page.goto('/es/tricks/backward');
    await page.locator('a[href*="/tricks/backward/"]').first().click();

    await expect(page).toHaveURL(/\/es\/tricks\/backward\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
