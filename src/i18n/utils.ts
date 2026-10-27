import ru from './ru.json';
import uk from './uk.json';
import en from './en.json';
import es from './es.json';

export const languages = {
  ru: { label: 'RU', name: 'Русский', htmlLang: 'ru', dict: ru },
  uk: { label: 'UA', name: 'Українська', htmlLang: 'uk', dict: uk },
  en: { label: 'EN', name: 'English', htmlLang: 'en', dict: en },
  es: { label: 'ES', name: 'Español', htmlLang: 'es', dict: es },
} as const;

export type Lang = keyof typeof languages;
export type Dict = typeof ru;

export const defaultLang: Lang = 'ru';
export const langCodes = Object.keys(languages) as Lang[];

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && value in languages;
}

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  return isLang(first) ? first : defaultLang;
}

export function useTranslations(lang: Lang): Dict {
  return languages[lang].dict as Dict;
}

export function t(lang: Lang, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], languages[lang].dict);
  return typeof value === 'string' ? value : path;
}

export type PageSlug = '' | 'legal' | 'privacy' | 'cookies';

export function localePath(lang: Lang, slug: PageSlug = '') {
  const prefix = lang === defaultLang ? '' : `/${lang}`;
  return slug ? `${prefix}/${slug}/` : `${prefix}/`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function accent(value: string) {
  return escapeHtml(value).replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function plain(value: string) {
  return value.replace(/\*/g, '');
}
