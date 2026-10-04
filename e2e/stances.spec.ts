import { expect, test } from '@playwright/test';

test.describe('seccion stances', () => {
  test('lista los 6 stances con su titulo', async ({ page }) => {
    await page.goto('/es/stances');
    await expect(page.getByRole('heading', { level: 1, name: 'Posturas' })).toBeVisible();
    await expect(page.locator('a[href*="/stances/"]')).toHaveCount(6);
  });

  test('el API de stances responde con al menos 6 stances', async ({ request }) => {
    const response = await request.get('/api/stances');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(6);
    expect(body.items.length).toBeGreaterThanOrEqual(6);
  });

  test('abre el detalle del primer stance', async ({ page }) => {
    await page.goto('/es/stances');
    await page.locator('a[href*="/stances/"]').first().click();

    await expect(page).toHaveURL(/\/es\/stances\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
