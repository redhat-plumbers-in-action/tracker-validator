import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Make sure we load the dotenv config before running tests
    setupFiles: ['dotenv/config'],
  },
});
