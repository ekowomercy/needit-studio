import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // PGlite (WASM Postgres) spins up a fresh in-memory instance per test,
    // which can take several seconds on a cold start. Give tests room to finish
    // while still running serially to avoid WASM contention.
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    maxWorkers: 1,
  },
});
