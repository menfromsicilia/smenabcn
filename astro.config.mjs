import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://smenabcn.com',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'always' },
  i18n: {
    locales: ['ru', 'uk', 'en', 'es'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    vue(),
    sitemap({
      i18n: {
        defaultLocale: 'ru',
        locales: { ru: 'ru', uk: 'uk', en: 'en', es: 'es' },
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
