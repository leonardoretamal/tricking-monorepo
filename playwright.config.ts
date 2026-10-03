import { defineConfig, devices } from '@playwright/test';

// URL base configurable por variable de entorno. El valor por defecto apunta al
// puerto de desarrollo habitual; se ajustara cuando exista apps/web en la Fase 2.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // Viewport movil base 390x600 (prohibido 390x844). El proyecto chromium usa
    // el viewport propio de Desktop Chrome; el proyecto mobile fuerza este valor.
    viewport: { width: 390, height: 600 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        // devices['Pixel 5'] trae viewport 393x727. Se desactiva ese viewport
        // por defecto y se fuerza el viewport exigido de 390x600.
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 600 },
      },
    },
  ],
  // El webServer se agrega en la Fase 2, cuando exista apps/web.
});
