import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/e2e/**',
    ],
    passWithNoTests: true,
  },
});
