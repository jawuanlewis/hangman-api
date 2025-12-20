/**
 * Vitest configuration for hangman-api. See docs for option details:
 * https://vitest.dev/config/
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.js', '.prettierrc.js'],
    },
    testTimeout: 5000,
    hookTimeout: 10000,
    globals: true,
    pool: 'threads',
  },
});
