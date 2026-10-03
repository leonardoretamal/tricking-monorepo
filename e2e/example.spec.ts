import { expect, test } from '@playwright/test';

// Prueba de ejemplo que no depende de una app real todavia.
// Se activa en la Fase 2, cuando exista apps/web en la URL base configurada.
test.skip('la pagina de inicio responde y muestra su titulo', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/tricking/i);
});
