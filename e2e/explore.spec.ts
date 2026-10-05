import { expect, test } from '@playwright/test';

test.describe('seccion explore', () => {
  test('muestra el encabezado y el grafo', async ({ page }) => {
    await page.goto('/es/explore');
    await expect(page.getByRole('heading', { level: 1, name: 'Explorar' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Grafo de trucos' })).toBeVisible();
    await expect(
      page.getByRole('group', { name: 'Grafo de trucos' }).locator('[data-node-id]').first(),
    ).toBeVisible();
  });

  test('el API de graph responde 200 con nodos y aristas', async ({ request }) => {
    const response = await request.get('/api/graph?section=vertical-kicks&maxNodes=50');
    expect(response.status()).toBe(200);

    const body: { nodes: unknown[]; edges: unknown[]; total: number; maxNodes: number } =
      await response.json();
    expect(body.nodes.length).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThanOrEqual(body.nodes.length);
    expect(body.maxNodes).toBe(50);
    expect(Array.isArray(body.edges)).toBe(true);
  });

  test('rechaza filtros invalidos', async ({ request }) => {
    const response = await request.get('/api/graph?difficulty=9');
    expect(response.status()).toBe(400);
  });

  test('abre el panel lateral al seleccionar un nodo', async ({ page }) => {
    await page.goto('/es/explore?section=vertical-kicks');
    const graph = page.getByRole('group', { name: 'Grafo de trucos' });
    await graph.locator('[data-node-id]').first().focus();
    await page.keyboard.press('Enter');

    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Ver detalle del truco' })).toBeVisible();
  });

  test('cierra el panel con Escape', async ({ page }) => {
    await page.goto('/es/explore?section=vertical-kicks');
    const graph = page.getByRole('group', { name: 'Grafo de trucos' });
    await graph.locator('[data-node-id]').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('actualiza la URL al cambiar de seccion', async ({ page }) => {
    await page.goto('/es/explore');
    // El grafo se monta en cliente; esperar a que hidrate evita seleccionar antes de
    // que React ate el onChange del filtro.
    await expect(page.getByRole('group', { name: 'Grafo de trucos' })).toBeVisible();
    await page.getByLabel('Sección').selectOption('backward');
    await expect(page).toHaveURL(/section=backward/);
  });
});
