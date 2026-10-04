import { expect, test } from '@playwright/test';

test.describe('seccion outside', () => {
  test('lista los trucos outside con su titulo y tarjetas', async ({ page }) => {
    await page.goto('/es/tricks/outside');
    await expect(page.getByRole('heading', { level: 1, name: 'Exterior' })).toBeVisible();
    await expect(page.locator('a[href*="/tricks/outside/"]').first()).toBeVisible();
  });

  test('el API de outside responde paginado con al menos 70 trucos', async ({ request }) => {
    const response = await request.get('/api/tricks?section=outside&pageSize=1');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(70);
    expect(body.items).toHaveLength(1);
  });

  test('abre el detalle del primer truco outside', async ({ page }) => {
    await page.goto('/es/tricks/outside');
    await page.locator('a[href*="/tricks/outside/"]').first().click();

    await expect(page).toHaveURL(/\/es\/tricks\/outside\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
