import { expect, test } from '@playwright/test';

test.describe('seccion transitions', () => {
  test('lista las transiciones agrupadas por grupo', async ({ page }) => {
    await page.goto('/es/transitions');
    await expect(page.getByRole('heading', { level: 1, name: 'Transiciones' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Unified' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Singular' })).toBeVisible();
    await expect(page.locator('a[href*="/transitions/"]').first()).toBeVisible();
  });

  test('el API de transiciones responde 200 con el total', async ({ request }) => {
    const response = await request.get('/api/transitions');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(16);
    expect(body.items.length).toBeGreaterThan(0);
  });

  test('abre el detalle de una transicion', async ({ page }) => {
    await page.goto('/es/transitions');
    await page.locator('a[href*="/transitions/"]').first().click();

    // El detalle compila en la primera visita del dev server; se le da margen.
    await expect(page).toHaveURL(/\/es\/transitions\/.+/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
