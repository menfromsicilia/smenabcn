import { leadMeta } from './lead-meta';

export type SubmitResult = { ok: true } | { ok: false; error: string; status: number };

export async function submitLead(payload: Record<string, unknown>): Promise<SubmitResult> {
  try {
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...leadMeta() }),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (response.ok && data.ok) return { ok: true };
    return { ok: false, error: data.error || 'server', status: response.status };
  } catch {
    return { ok: false, error: 'network', status: 0 };
  }
}
