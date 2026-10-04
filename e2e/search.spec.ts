import { expect, test } from '@playwright/test';

test.describe('busqueda global', () => {
  test('el API responde paginado con resultados reales', async ({ request }) => {
    const response = await request.get('/api/search?q=aerial&pageSize=5');
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      total: number;
      items: unknown[];
      page: number;
      pageSize: number;
      totalPages: number;
    };
    expect(body.total).toBeGreaterThan(0);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(5);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(5);
  });

  test('el API rechaza una busqueda de menos de dos caracteres', async ({ request }) => {
    const response = await request.get('/api/search?q=a');
    expect(response.status()).toBe(400);
  });

  test('el API filtra por tipo', async ({ request }) => {
    const response = await request.get('/api/search?q=aerial&type=trick&pageSize=10');
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { items: { type: string }[] };
    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item.type).toBe('trick');
    }
  });

  test('la pagina dedicada busca y resalta coincidencias con enlaces por tipo', async ({
    page,
  }) => {
    await page.goto('/es/search?q=aerial');
    await expect(page.getByRole('heading', { level: 1, name: 'Buscar' })).toBeVisible();
    await expect(page.locator('mark').first()).toBeVisible();
    await expect(
      page
        .locator('a[href*="/tricks/"]')
        .filter({ hasText: /aerial/i })
        .first(),
    ).toBeVisible();
  });

  test('una busqueda sin resultados muestra el estado vacio', async ({ page }) => {
    await page.goto('/es/search?q=zzzzzzzz');
    await expect(page.getByText(/Sin resultados/i).first()).toBeVisible();
  });

  test('la busqueda en la navbar navega a la pagina dedicada', async ({ page }) => {
    await page.goto('/es');
    await page.getByRole('search').first().locator('input[type="search"]').fill('aerial');
    await expect(page).toHaveURL(/\/es\/search\?q=aerial/);
  });
});
