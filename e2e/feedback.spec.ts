import { expect, test } from '@playwright/test';

test.describe('seccion feedback', () => {
  test('muestra el formulario de feedback', async ({ page }) => {
    await page.goto('/es/feedback');
    await expect(page.getByRole('heading', { level: 1, name: 'Enviar feedback' })).toBeVisible();
    await expect(page.locator('#feedback-message')).toBeVisible();
  });

  test('valida el mensaje obligatorio antes de enviar', async ({ page }) => {
    await page.goto('/es/feedback');
    await page.getByRole('button', { name: 'Enviar feedback' }).click();
    await expect(page.locator('#feedback-message-error')).toBeVisible();
  });

  test('el panel de administracion exige token', async ({ page }) => {
    await page.goto('/es/admin/feedback');
    await expect(page.locator('#feedback-admin-token')).toBeVisible();
  });

  test('el GET de feedback sin token responde 401', async ({ request }) => {
    const response = await request.get('/api/feedback');
    expect(response.status()).toBe(401);
  });

  test('el POST rechaza un cuerpo invalido', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: { type: 'inventado', message: '' },
    });
    expect(response.status()).toBe(400);
  });
});
