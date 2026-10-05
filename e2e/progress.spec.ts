import { readFile } from 'node:fs/promises';

import { expect, test, type Page } from '@playwright/test';

const SECTION = 'vertical-kicks';
const STORAGE_KEY = 'tricking:progress';

async function firstTrickId(page: Page): Promise<string> {
  const response = await page.request.get(`/api/tricks?section=${SECTION}&pageSize=1`);
  expect(response.status()).toBe(200);
  const body: { items: { id: string }[] } = await response.json();
  const id = body.items[0]?.id;
  if (id === undefined) {
    throw new Error('Sin trucos para la seccion de prueba');
  }
  return id;
}

async function clearProgress(page: Page): Promise<void> {
  await page.goto('/es');
  await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY);
}

async function seedProgress(page: Page, tricks: Record<string, string>): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify({ value, expiresAt: null }));
    },
    {
      key: STORAGE_KEY,
      value: { version: 1, updatedAt: new Date().toISOString(), tricks },
    },
  );
}

test.describe('progreso del usuario sin login', () => {
  test('marca un truco, persiste tras recargar y se puede desmarcar', async ({ page }) => {
    await clearProgress(page);
    const trickId = await firstTrickId(page);

    await page.goto(`/es/tricks/${SECTION}/${trickId}`);
    const learned = page.getByRole('button', { name: 'Ya lo tengo' });
    await expect(learned).toHaveAttribute('aria-pressed', 'false');

    // toPass reintenta el click hasta que la hidratacion de React este lista.
    await expect(async () => {
      if ((await learned.getAttribute('aria-pressed')) !== 'true') {
        await learned.click();
      }
      await expect(learned).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 });
    }).toPass({ timeout: 15000 });

    // La UI reacciona sin recargar: aparece el badge de estado.
    await expect(page.getByText('Aprendido', { exact: true })).toBeVisible();

    // Se guardo por el wrapper (clave con prefijo) y con el formato del envelope.
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY))
      .toContain(trickId);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Ya lo tengo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { name: 'Quitar marca' }).click();
    await expect(page.getByRole('button', { name: 'Ya lo tengo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('el resumen refleja el progreso y permite borrar todo con confirmacion', async ({
    page,
  }) => {
    await clearProgress(page);
    const trickId = await firstTrickId(page);
    await seedProgress(page, { [trickId]: 'learned' });

    await page.goto('/es/progress');
    await expect(page.getByRole('heading', { level: 1, name: 'Progreso' })).toBeVisible();
    await expect(page.getByText(/1 de [\d.]+ trucos aprendidos/)).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Progreso global' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    await expect(page.getByRole('progressbar', { name: 'Patadas verticales' })).toBeVisible();

    await page.getByRole('button', { name: 'Borrar todo' }).first().click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Borrar todo' }).click();
    await expect(page.getByText(/0 de [\d.]+ trucos aprendidos/)).toBeVisible();
  });

  test('exporta e importa el progreso en JSON', async ({ page }) => {
    await clearProgress(page);
    const trickId = await firstTrickId(page);
    await seedProgress(page, { [trickId]: 'learned' });

    await page.goto('/es/progress');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar JSON' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('tricking-progress.json');

    const filePath = await download.path();
    if (filePath === null) {
      throw new Error('La descarga no tiene ruta');
    }
    const raw = await readFile(filePath, 'utf8');
    const parsed: { tricks: Record<string, string> } = JSON.parse(raw);
    expect(parsed.tricks[trickId]).toBe('learned');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'progress-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          tricks: { [trickId]: 'want' },
        }),
      ),
    });
    await expect(page.getByText('Progreso importado.')).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY))
      .toContain('"want"');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'progress-invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ foo: 1 })),
    });
    await expect(page.getByText('El archivo no tiene un progreso válido.')).toBeVisible();
  });
});
