import { expect, test } from '@playwright/test';

test.describe('legal y SEO tecnico', () => {
  test('el aviso legal responde 200 y muestra el encabezado', async ({ page }) => {
    const response = await page.goto('/es/legal');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Aviso legal' })).toBeVisible();
  });

  test('la politica de privacidad responde 200 y muestra el encabezado', async ({ page }) => {
    const response = await page.goto('/es/privacidad');
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Política de privacidad' }),
    ).toBeVisible();
  });

  test('robots.txt responde 200 y declara el sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('/sitemap.xml');
  });

  test('sitemap.xml responde 200 con las rutas', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('/es/legal');
  });
});
