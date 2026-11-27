// Unit tests for the marketing site's sign-up and teen logic (npm test). Plain Node: no browser, no build plugins.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
