import { expect, test } from '@playwright/test';

test.describe('seccion tips de mirada', () => {
  test('lista los bloques destacados y los tipos', async ({ page }) => {
    await page.goto('/es/tips');
    await expect(page.getByRole('heading', { level: 1, name: 'Tips de mirada' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Idea clave' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Regla de oro' })).toBeVisible();
    await expect(page.locator('a[href*="/tips/"]').first()).toBeVisible();
  });

  test('abre el detalle de un tipo con sus fases', async ({ page }) => {
    await page.goto('/es/tips/backward');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('No mires tus pies.')).toBeVisible();
  });

  test('el API de tips responde con contenido', async ({ request }) => {
    const response = await request.get('/api/tips?locale=es');
    expect(response.status()).toBe(200);

    const body: { total: number } = await response.json();
    expect(body.total).toBeGreaterThan(0);
  });
});
