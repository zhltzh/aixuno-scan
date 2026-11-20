import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const pages = [
  'index',
  'about',
  'contact',
  'privacy',
  'terms',
  'disclaimer',
  'changelog',
  'zh/index',
];

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((p) => [p, fileURLToPath(new URL(`./${p}.html`, import.meta.url))])
      ),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
