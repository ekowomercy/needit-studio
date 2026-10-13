import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  clean: true,
  banner: { js: 'require("reflect-metadata");' },
  noExternal: [/^@needit\//],
  esbuildPlugins: [],
});