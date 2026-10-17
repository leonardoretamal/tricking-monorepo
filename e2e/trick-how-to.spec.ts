import { expect, test } from '@playwright/test';

// Fase 45: detalle del truco con "como se hace" estructurado, ruta de aprendizaje y
// pestanas de video. Usa el truco piloto Wackknife (tiene detalle en es/en y, ademas, un
// tutorial externo cargado en la base). El reproductor pide los videos al cliente, por eso
// las aserciones de las pestanas esperan con un tope amplio: en un dev server frio la
// primera peticion a /api/videos compila la ruta y puede tardar mas de 5 segundos.

const VIDEO_TIMEOUT = 20_000;

test.describe('como se hace detallado del truco', () => {
  test('muestra el detalle estructurado y la ruta de aprendizaje', async ({ page }) => {
    await page.goto('/es/tricks/vertical-kicks/wackknife');

    await expect(page.getByRole('heading', { level: 1, name: 'Wackknife' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cómo se hace paso a paso' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Antes de empezar' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Paso a paso', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Glosario' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ruta de aprendizaje' })).toBeVisible();

    // El prerequisito Tornado se enlaza desde la ruta de aprendizaje.
    await expect(page.getByRole('link', { name: 'Tornado' })).toBeVisible();

    // Los pasos numerados estan presentes.
    await expect(page.getByText('Prepara el paso')).toBeVisible();
  });

  test('el reproductor tiene las pestanas Ejecucion y Tutorial cuando hay tutorial', async ({
    page,
  }) => {
    await page.goto('/es/tricks/vertical-kicks/wackknife');

    await expect(page.getByRole('tablist', { name: 'Videos del truco' })).toBeVisible({
      timeout: VIDEO_TIMEOUT,
    });

    const demo = page.getByRole('tab', { name: 'Ejecución' });
    const tutorial = page.getByRole('tab', { name: 'Tutorial' });
    await expect(demo).toBeVisible();
    await expect(tutorial).toBeVisible();
    await expect(demo).toHaveAttribute('aria-selected', 'true');

    await tutorial.click();
    await expect(tutorial).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('sin tutorial oculta la pestana y muestra la nota', async ({ page }) => {
    await page.goto('/es/tricks/vertical-kicks/wackknifeRound');

    await expect(page.getByRole('tab', { name: 'Ejecución' })).toBeVisible({
      timeout: VIDEO_TIMEOUT,
    });
    await expect(page.getByRole('tab', { name: 'Tutorial' })).toHaveCount(0);
    await expect(page.getByText('Sin tutorial todavía')).toBeVisible();
  });
});
