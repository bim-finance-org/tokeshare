import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Pure-logic unit tests run in Node; no DOM needed for the current suite.
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    // Mirror the tsconfig `@/*` path alias.
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
