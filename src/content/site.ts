import type { ImageMetadata } from 'astro';

export type RoleKey = 'floor' | 'coffee' | 'front' | 'beauty';
export type PhotoKey = 'barista' | 'waiter' | 'beauty' | 'reception' | 'form';

const whatsappNumber = (import.meta.env.PUBLIC_WHATSAPP_NUMBER as string | undefined) || '34617534042';

export const site = {
  url: 'https://smenabcn.com',
  brand: 'Smena',
  city: 'Barcelona',
  whatsappNumber,
  whatsappDisplay: '+34 617 534 042',
  email: 'hello@smenabcn.com',
  legalEntity: '[NOMBRE / NIF]',
  socials: {
    instagram: '',
    tiktok: '',
    linkedin: '',
    telegram: '',
  },
  analytics: {
    provider: 'plausible' as 'plausible' | 'umami' | 'none',
    plausibleDomain: '',
    plausibleSrc: 'https://plausible.io/js/script.tagged-events.js',
    umamiWebsiteId: '',
    umamiSrc: 'https://cloud.umami.is/script.js',
  },
  sections: {
    faq: false,
    testimonials: false,
    stats: false,
    pricing: false,
  },
  roleColors: {
    floor: 'tomato',
    coffee: 'butter',
    front: 'surface',
    beauty: 'blush',
  } satisfies Record<RoleKey, string>,
  photos: {} as Partial<Record<PhotoKey, ImageMetadata>>,
};

export const roleKeys: RoleKey[] = ['floor', 'coffee', 'front', 'beauty'];

export function whatsappLink(text: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
