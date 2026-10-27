import type { RoleKey } from '../content/site';

export type FormIntent = { kind: 'business'; role?: RoleKey } | { kind: 'candidate' };

declare global {
  interface Window {
    __smenaIntent?: FormIntent;
  }
}

export const INTENT_EVENT = 'smena:intent';

export function requestForm(intent: FormIntent) {
  window.__smenaIntent = intent;
  window.dispatchEvent(new CustomEvent<FormIntent>(INTENT_EVENT, { detail: intent }));
}

export function onIntent<K extends FormIntent['kind']>(kind: K, handler: (intent: Extract<FormIntent, { kind: K }>) => void) {
  const pending = window.__smenaIntent;
  if (pending?.kind === kind) {
    window.__smenaIntent = undefined;
    handler(pending as Extract<FormIntent, { kind: K }>);
  }
  const listener = (event: Event) => {
    const intent = (event as CustomEvent<FormIntent>).detail;
    if (intent.kind !== kind) return;
    window.__smenaIntent = undefined;
    handler(intent as Extract<FormIntent, { kind: K }>);
  };
  window.addEventListener(INTENT_EVENT, listener);
  return () => window.removeEventListener(INTENT_EVENT, listener);
}
