type Props = Record<string, string | number | boolean>;

type Plausible = ((event: string, options?: { props?: Props }) => void) & { q?: unknown[] };

declare global {
  interface Window {
    plausible?: Plausible;
    umami?: { track: (event: string, props?: Props) => void };
  }
}

export function track(event: string, props?: Props) {
  try {
    if (window.umami) {
      window.umami.track(event, props);
      return;
    }
    if (!window.plausible) {
      const queue: Plausible = (...args: unknown[]) => {
        (queue.q = queue.q || []).push(args);
      };
      window.plausible = queue;
    }
    window.plausible(event, props ? { props } : undefined);
  } catch {
    /* empty */
  }
}
