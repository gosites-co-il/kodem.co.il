import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: 'src',
  outDir: '../../dist/apps/marketing',
  publicDir: 'public',
  server: { port: 4321 },
});
