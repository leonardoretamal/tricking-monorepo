import { expect, test } from '@playwright/test';

test.describe('seccion vertical kicks', () => {
  test('lista los trucos vertical kicks con su titulo y tarjetas', async ({ page }) => {
    await page.goto('/es/tricks/vertical-kicks');
    await expect(page.getByRole('heading', { level: 1, name: 'Patadas verticales' })).toBeVisible();
    await expect(page.locator('a[href*="/tricks/vertical-kicks/"]').first()).toBeVisible();
  });

  test('el API de vertical kicks responde paginado con al menos 90 trucos', async ({ request }) => {
    const response = await request.get('/api/tricks?section=vertical-kicks&pageSize=1');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(90);
    expect(body.items).toHaveLength(1);
  });

  test('el listado muestra badges de dificultad 3', async ({ page }) => {
    await page.goto('/es/tricks/vertical-kicks');
    await expect(page.locator('.tb-difficulty-3').first()).toBeVisible();
  });

  test('abre el detalle del primer truco vertical kicks', async ({ page }) => {
    await page.goto('/es/tricks/vertical-kicks');
    await page.locator('a[href*="/tricks/vertical-kicks/"]').first().click();

    await expect(page).toHaveURL(/\/es\/tricks\/vertical-kicks\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
