import { expect, test } from '@playwright/test';

test('la raiz redirige al locale por defecto y responde', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/es(\/|$)/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('el layout base muestra navbar, toggle de tema y footer', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('navigation', { name: /navegaci/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cambiar tema' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});

test('el tema arranca oscuro por defecto y el toggle alterna y persiste', async ({ page }) => {
  // El proyecto es dark-first: con el sistema en oscuro, arranca en tricking-dark.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/es');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'tricking-dark');

  // toPass reintenta el click hasta que la hidratacion de React este lista.
  await expect(async () => {
    if ((await html.getAttribute('data-theme')) !== 'tricking-light') {
      await page.getByRole('button', { name: 'Cambiar tema' }).click();
    }
    await expect(html).toHaveAttribute('data-theme', 'tricking-light', { timeout: 1000 });
  }).toPass({ timeout: 15000 });

  const stored = await page.evaluate(() => window.localStorage.getItem('tricking:theme'));
  expect(stored).toContain('tricking-light');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'tricking-light');
});

test('el selector de idioma navega de es a en', async ({ page }) => {
  await page.goto('/es');
  await expect(async () => {
    if (!page.url().includes('/en')) {
      await page.getByRole('combobox', { name: 'Cambiar idioma' }).selectOption('en');
    }
    await expect(page).toHaveURL(/\/en(\/|$)/, { timeout: 1000 });
  }).toPass({ timeout: 15000 });
});

test('cada seccion vacia responde con su titulo', async ({ page }) => {
  const sections = ['tricks', 'variations', 'transitions', 'stances', 'tips', 'explore', 'search'];
  for (const section of sections) {
    await page.goto(`/es/${section}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('una ruta desconocida muestra la 404 personalizada', async ({ page }) => {
  await page.goto('/es/ruta-que-no-existe');
  await expect(page.getByText('Página no encontrada')).toBeVisible();
});

test('el submenu de trucos abre por teclado en escritorio', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'solo escritorio');
  await page.goto('/es');
  await expect(async () => {
    const button = page.getByRole('button', { name: 'Trucos' });
    if ((await button.getAttribute('aria-expanded')) !== 'true') {
      await button.focus();
      await page.keyboard.press('Enter');
    }
    await expect(button).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
  }).toPass({ timeout: 15000 });
});

test('el menu hamburguesa abre en movil', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'solo movil');
  await page.goto('/es');
  await expect(async () => {
    const button = page.getByRole('button', { name: /Abrir menú|Cerrar menú/ });
    if ((await button.getAttribute('aria-expanded')) !== 'true') {
      await button.click();
    }
    await expect(button).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
  }).toPass({ timeout: 15000 });
});
