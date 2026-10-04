import { expect, test } from '@playwright/test';

// Regresion de la correccion de la Fase 3: los prereqs y siguientes del detalle se
// resuelven por nombre a ids (tabla trick_relations) y no salen vacios. Aerial tiene
// 2 prereqs y 7 siguientes sembrados.
test.describe('relaciones de truco', () => {
  test('el detalle de Aerial muestra prerrequisitos y siguientes', async ({ page }) => {
    await page.goto('/es/tricks/inside/aerial');
    await expect(page.getByRole('heading', { level: 1, name: 'Aerial' })).toBeVisible();

    const prereqHeading = page.getByRole('heading', { name: 'Prerrequisitos' });
    const nextHeading = page.getByRole('heading', { name: 'Siguientes trucos' });
    await expect(prereqHeading).toBeVisible();
    await expect(nextHeading).toBeVisible();

    const nextSection = page.locator('section', { has: nextHeading });
    await expect(nextSection.getByRole('link').first()).toBeVisible();
  });
});
