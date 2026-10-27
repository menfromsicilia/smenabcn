import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { langCodes, plain, useTranslations, type Lang } from '../../i18n/utils';

export const getStaticPaths: GetStaticPaths = () => langCodes.map((lang) => ({ params: { lang } }));

const fontDir = (pkg: string) => join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files');

const SUBSETS = ['cyrillic', 'latin', 'latin-ext'];
const family = (name: string) => SUBSETS.map((subset) => `${name}-${subset}`).join(', ');

async function loadFonts() {
  const files = [
    { name: 'Playfair', pkg: 'playfair-display', file: 'playfair-display', weight: 400, style: 'normal' },
    { name: 'Playfair', pkg: 'playfair-display', file: 'playfair-display', weight: 400, style: 'italic' },
    { name: 'Montserrat', pkg: 'montserrat', file: 'montserrat', weight: 600, style: 'normal' },
  ] as const;
  const fonts = [];
  for (const font of files) {
    for (const subset of SUBSETS) {
      const data = await readFile(join(fontDir(font.pkg), `${font.file}-${subset}-${font.weight}-${font.style}.woff`));
      fonts.push({ name: `${font.name}-${subset}`, data, weight: font.weight, style: font.style });
    }
  }
  return fonts;
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as Lang;
  const t = useTranslations(lang);
  const [before, accentWord] = t.hero.title.split('*');
  const tree = h(
    'div',
    { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 56, padding: '60px 72px', background: '#F3F2EE', color: '#1C1A17', fontFamily: family('Montserrat') },
    [
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 1056 }, [
        h('div', { display: 'flex', alignItems: 'flex-start', gap: 10 }, [
          h('div', { fontFamily: family('Playfair'), fontStyle: 'italic', fontSize: 56, letterSpacing: -2 }, 'Smena'),
          h('div', { marginTop: 8, padding: '5px 12px', borderRadius: 999, background: '#E8553A', fontSize: 16, letterSpacing: 2 }, 'BCN'),
        ]),
        h('div', { display: 'flex', fontSize: 16, letterSpacing: 2, textTransform: 'uppercase', color: '#5B554C' }, t.brand.descriptor),
      ]),
      h('div', { display: 'flex', flexWrap: 'wrap', fontFamily: family('Playfair'), fontSize: 62, lineHeight: 1.04, letterSpacing: -2, textTransform: 'uppercase', maxWidth: 1000 }, [
        h('span', { marginRight: 18 }, plain(before ?? '').trim()),
        h('span', { fontStyle: 'italic', textTransform: 'none', color: '#B8371F' }, accentWord ?? ''),
      ]),
      h('div', { display: 'flex', flexWrap: 'wrap', gap: 14, width: 1056 }, t.hero.facts.map((fact, index) =>
        h('div', { display: 'flex', padding: '14px 24px', borderRadius: 999, background: ['#FFF7A0', '#F3B8C4', '#1C1A17'][index], color: index === 2 ? '#F3F2EE' : '#1C1A17', fontSize: 20 }, `${fact.value} — ${fact.label}`),
      )),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: (await loadFonts()) as never });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
