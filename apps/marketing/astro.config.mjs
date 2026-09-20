import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  srcDir: 'src',
  outDir: '../../dist/apps/marketing',
  publicDir: 'public',
  server: { port: 4321 },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@kodem/design-system': path.join(root, 'libs/design-system/src'),
        '@kodem/platform/legal': path.join(root, 'libs/platform/legal/src/index.ts'),
        '@kodem/contracts': path.join(root, 'libs/contracts/src/index.ts'),
      },
    },
    ssr: {
      // Bundle cookie into the prerender entry (avoids Node resolving Express cookie@0.7).
      noExternal: ['cookie'],
    },
  },
});
