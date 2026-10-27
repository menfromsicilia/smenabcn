import { track } from './analytics';
import { requestForm } from './intent';
import { captureUtm } from './lead-meta';
import type { RoleKey } from '../content/site';

captureUtm();

const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

function currentSectionId() {
  const sections = [...document.querySelectorAll<HTMLElement>('main section[id], footer[id]')];
  const probe = window.innerHeight * 0.35;
  let current = '';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= probe) current = section.id;
  }
  return current && current !== 'top' ? current : '';
}

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;
  if (!target) return;

  const langLink = target.closest<HTMLAnchorElement>('a[data-lang-link]');
  if (langLink) {
    const hash = location.hash || (currentSectionId() ? `#${currentSectionId()}` : '');
    if (hash) langLink.href = langLink.href.split('#')[0] + hash;
  }

  const intentEl = target.closest<HTMLElement>('[data-intent]');
  if (intentEl) {
    const kind = intentEl.dataset.intent;
    if (kind === 'candidate') requestForm({ kind: 'candidate' });
    if (kind === 'business') requestForm({ kind: 'business', role: intentEl.dataset.role as RoleKey | undefined });
  }

  const eventEl = target.closest<HTMLElement>('[data-event]');
  if (eventEl?.dataset.event) {
    const props = eventEl.dataset.eventRole ? { role: eventEl.dataset.eventRole } : undefined;
    track(eventEl.dataset.event, props);
  }

  const waLink = target.closest<HTMLAnchorElement>('a[href^="https://wa.me/"]');
  if (waLink) track('whatsapp_click', { placement: waLink.dataset.waPlacement || 'other' });
});

const hint = document.querySelector<HTMLElement>('[data-lang-hint]');
if (hint) {
  let dismissed = false;
  try {
    dismissed = localStorage.getItem('smena:lang-hint') === '1';
  } catch {
    /* empty */
  }
  const prefersSpanish = (navigator.language || '').toLowerCase().startsWith('es');
  if (prefersSpanish && !dismissed) hint.hidden = false;
  hint.querySelector('[data-lang-hint-close]')?.addEventListener('click', () => {
    hint.hidden = true;
    try {
      localStorage.setItem('smena:lang-hint', '1');
    } catch {
      /* empty */
    }
  });
}
