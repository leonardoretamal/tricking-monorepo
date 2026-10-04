import { expect, test } from '@playwright/test';

test.describe('seccion variations', () => {
  test('lista las familias por defecto', async ({ page }) => {
    await page.goto('/es/variations');
    await expect(page.getByRole('heading', { level: 1, name: 'Variaciones' })).toBeVisible();
    await expect(page.getByRole('main').locator('a[href*="/variations/"]').first()).toBeVisible();
  });

  test('cambia de familias a concretas', async ({ page }) => {
    await page.goto('/es/variations');
    await page.getByRole('tab', { name: 'Concretas' }).click();
    await expect(page).toHaveURL(/kind=concrete/);
    await expect(page.getByRole('tab', { name: 'Concretas' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('main').locator('a[href*="/tricks/"]').first()).toBeVisible();
  });

  test('el API de variations responde 200 con familias', async ({ request }) => {
    const response = await request.get('/api/variations?kind=family&pageSize=1');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(19);
    expect(body.items).toHaveLength(1);
  });

  test('abre el detalle de una familia', async ({ page }) => {
    await page.goto('/es/variations');
    await page.getByRole('main').locator('a[href*="/variations/"]').first().click();

    await expect(page).toHaveURL(/\/es\/variations\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
