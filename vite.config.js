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
  'guides/index',
  'guides/paper-to-pdf-scan',
  'guides/ocr-editable-text',
  'guides/scan-id-card',
  'guides/remove-shadow-clear',
  'guides/multi-page-pdf',
  'zh/index',
  'zh/about',
  'zh/contact',
  'zh/privacy',
  'zh/terms',
  'zh/disclaimer',
  'zh/changelog',
  'zh/guides/index',
  'zh/guides/paper-to-pdf-scan',
  'zh/guides/ocr-editable-text',
  'zh/guides/scan-id-card',
  'zh/guides/remove-shadow-clear',
  'zh/guides/multi-page-pdf',
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
