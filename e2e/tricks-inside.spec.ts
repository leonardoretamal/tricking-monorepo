import { expect, test } from '@playwright/test';

test.describe('seccion inside', () => {
  test('el API de inside responde paginado con datos reales', async ({ request }) => {
    const response = await request.get('/api/tricks?section=inside&pageSize=1');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(100);
    expect(body.items).toHaveLength(1);
  });

  test('inside lista trucos y muestra la paginacion', async ({ page }) => {
    await page.goto('/es/tricks/inside');
    await expect(page.getByRole('heading', { level: 1, name: 'Inside' })).toBeVisible();
    await expect(page.locator('a[href*="/tricks/inside/"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeVisible();
  });

  test('abre el detalle de un truco de inside', async ({ page }) => {
    await page.goto('/es/tricks/inside');
    await page.locator('a[href*="/tricks/inside/"]').first().click();

    await expect(page).toHaveURL(/\/es\/tricks\/inside\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
