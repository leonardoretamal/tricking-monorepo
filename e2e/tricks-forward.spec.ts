import { expect, test } from '@playwright/test';

test.describe('seccion forward', () => {
  test('lista los trucos forward con su titulo y tarjetas', async ({ page }) => {
    await page.goto('/es/tricks/forward');
    await expect(page.getByRole('heading', { level: 1, name: 'Hacia adelante' })).toBeVisible();
    await expect(page.locator('a[href*="/tricks/forward/"]').first()).toBeVisible();
  });

  test('el API de forward responde paginado con al menos 15 trucos', async ({ request }) => {
    const response = await request.get('/api/tricks?section=forward&pageSize=1');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(15);
    expect(body.items).toHaveLength(1);
  });

  test('una sola pagina no muestra controles de paginacion', async ({ page }) => {
    await page.goto('/es/tricks/forward');
    await expect(page.locator('a[href*="/tricks/forward/"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Siguiente' })).toHaveCount(0);
  });

  test('abre el detalle del primer truco forward', async ({ page }) => {
    await page.goto('/es/tricks/forward');
    await page.locator('a[href*="/tricks/forward/"]').first().click();

    await expect(page).toHaveURL(/\/es\/tricks\/forward\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
