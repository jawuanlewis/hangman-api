/**
 * Vitest configuration for hangman-api. See docs for option details:
 * https://vitest.dev/config/
 */
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
    },
  },
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
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
    },
  },
});
