import { expect, test } from '@playwright/test';

test.describe('seccion tutorials', () => {
  test('muestra el listado de tutoriales de Kojo', async ({ page }) => {
    await page.goto('/es/tutorials');
    await expect(page.getByRole('heading', { level: 1, name: 'Tutoriales de Kojo' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('button').first()).toBeVisible();
  });

  test('el API de tutorials responde 200 con items paginados', async ({ request }) => {
    const response = await request.get('/api/tutorials?pageSize=5');
    expect(response.status()).toBe(200);

    const body: { total: number; items: unknown[] } = await response.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.items).toHaveLength(5);
  });

  test('el acordeon alterna aria-expanded al hacer clic', async ({ page }) => {
    await page.goto('/es/tutorials');
    const trigger = page.getByRole('main').getByRole('button').first();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('busca tutoriales por titulo', async ({ page }) => {
    await page.goto('/es/tutorials');
    await page.getByRole('main').getByRole('searchbox').fill('cork');
    await expect(page).toHaveURL(/q=cork/);
    await expect(page.getByRole('main').getByRole('button').first()).toBeVisible();
  });
});
