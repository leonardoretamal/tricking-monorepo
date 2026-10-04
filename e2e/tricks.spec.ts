import { expect, test } from '@playwright/test';

const SECTIONS = ['vertical-kicks', 'backward', 'forward', 'inside', 'outside'];

test.describe('seccion de trucos', () => {
  test('el API de trucos responde paginado con datos reales', async ({ request }) => {
    const response = await request.get('/api/tricks?section=vertical-kicks&pageSize=1');
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { total: number; items: unknown[] };
    expect(body.total).toBeGreaterThan(0);
    expect(body.items).toHaveLength(1);
  });

  test('vertical kicks lista trucos y muestra badges de dificultad', async ({ page }) => {
    await page.goto('/es/tricks/vertical-kicks');
    await expect(page.getByRole('heading', { level: 1, name: 'Patadas verticales' })).toBeVisible();
    await expect(page.locator('a[href*="/tricks/vertical-kicks/"]').first()).toBeVisible();
    await expect(page.locator('.tb-difficulty-3').first()).toBeVisible();
  });

  test('abre el detalle de un truco', async ({ page }) => {
    await page.goto('/es/tricks/vertical-kicks');
    await page.locator('a[href*="/tricks/vertical-kicks/"]').first().click();

    await expect(page).toHaveURL(/\/es\/tricks\/vertical-kicks\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('las cinco secciones responden con su titulo', async ({ page }) => {
    for (const section of SECTIONS) {
      await page.goto(`/es/tricks/${section}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('una seccion desconocida responde 404', async ({ page }) => {
    const response = await page.goto('/es/tricks/inexistente');
    expect(response?.status()).toBe(404);
  });
});
