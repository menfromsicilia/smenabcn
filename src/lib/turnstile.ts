type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITEKEY = (import.meta.env.PUBLIC_TURNSTILE_SITEKEY as string | undefined) || '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loading: Promise<void> | null = null;

export function preloadTurnstile() {
  if (!SITEKEY || loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('turnstile_load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function getTurnstileToken(container: HTMLElement, lang: string): Promise<string> {
  if (!SITEKEY) return '';
  await preloadTurnstile();
  const api = window.turnstile;
  if (!api) throw new Error('turnstile_missing');
  return new Promise<string>((resolve, reject) => {
    const id = api.render(container, {
      sitekey: SITEKEY,
      appearance: 'interaction-only',
      language: lang,
      callback: (token: string) => {
        resolve(token);
        setTimeout(() => api.remove(id), 0);
      },
      'error-callback': () => {
        api.remove(id);
        reject(new Error('turnstile_error'));
      },
      'timeout-callback': () => {
        api.remove(id);
        reject(new Error('turnstile_timeout'));
      },
    });
  });
}
