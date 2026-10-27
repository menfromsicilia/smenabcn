const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
const STORAGE_KEY = 'smena:utm';

type Utm = Record<(typeof UTM_KEYS)[number], string> & { referrer: string };

function read(): Partial<Utm> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function captureUtm() {
  const params = new URLSearchParams(location.search);
  const stored = read();
  const hasUtm = UTM_KEYS.some((key) => params.get(key));
  const next: Partial<Utm> = hasUtm
    ? Object.fromEntries(UTM_KEYS.map((key) => [key, params.get(key) ?? '']))
    : stored;
  if (!next.referrer && document.referrer && !document.referrer.startsWith(location.origin)) {
    next.referrer = document.referrer;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* empty */
  }
}

export function leadMeta() {
  const stored = read();
  return {
    utm_source: stored.utm_source ?? '',
    utm_medium: stored.utm_medium ?? '',
    utm_campaign: stored.utm_campaign ?? '',
    utm_content: stored.utm_content ?? '',
    referrer: stored.referrer ?? '',
    page_url: location.href.slice(0, 500),
    timestamp: new Date().toISOString(),
  };
}
