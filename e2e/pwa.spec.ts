import { expect, test } from '@playwright/test';

test.describe('seccion pwa', () => {
  test('el manifest responde 200 y trae name', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('"name"');
    expect(body).toContain('"start_url"');
    expect(body).toContain('"standalone"');
  });

  test('la pagina offline responde 200', async ({ page }) => {
    const response = await page.goto('/es/offline');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('el service worker esta publicado', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
  });
});
