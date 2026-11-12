import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  // The shared package ships raw TypeScript, so it is bundled in.
  noExternal: ['@gym/shared'],
});
