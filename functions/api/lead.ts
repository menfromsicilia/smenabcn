import { leadSchema, fieldErrors, type Lead } from '../../src/lib/lead-schema';

interface Env {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TG_THREAD_BUSINESS?: string;
  TG_THREAD_CANDIDATE?: string;
  SHEETS_WEBHOOK_URL?: string;
  SHEETS_WEBHOOK_SECRET?: string;
  TURNSTILE_SECRET?: string;
  RATE_LIMIT?: KVNamespace;
}

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const memoryHits = new Map<string, number[]>();

const ROLE_LABELS: Record<string, string> = {
  floor: 'Sala y barra',
  coffee: 'Cafetería / barista',
  front: 'Recepción y gestión',
  beauty: 'Belleza',
  other: 'Otro',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function isRateLimited(env: Env, ip: string) {
  const now = Date.now();
  const key = `rl:${ip}`;
  let hits: number[];
  if (env.RATE_LIMIT) {
    hits = JSON.parse((await env.RATE_LIMIT.get(key)) || '[]');
  } else {
    hits = memoryHits.get(key) || [];
  }
  hits = hits.filter((time) => now - time < RATE_WINDOW_MS);
  const limited = hits.length >= RATE_LIMIT;
  if (!limited) hits.push(now);
  if (env.RATE_LIMIT) {
    await env.RATE_LIMIT.put(key, JSON.stringify(hits), { expirationTtl: Math.ceil(RATE_WINDOW_MS / 1000) + 60 });
  } else {
    memoryHits.set(key, hits);
  }
  return limited;
}

async function verifyTurnstile(env: Env, token: string, ip: string) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function telegramText(lead: Lead) {
  const lang = lead.lang.toUpperCase();
  const phone = escapeHtml(lead.whatsapp);
  const wa = `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`;
  const utm = [lead.utm_source, lead.utm_medium, lead.utm_campaign || lead.utm_content].filter(Boolean).join(' / ');
  const lines =
    lead.type === 'business'
      ? [
          `🟠 Новая заявка (${lang})`,
          `👤 ${escapeHtml(lead.name)} — ${escapeHtml(lead.business)}`,
          `🎯 ${ROLE_LABELS[lead.role] ?? lead.role}`,
        ]
      : [`🟢 Новый соискатель (${lang})`, `👤 ${escapeHtml(lead.name)}`, `🎯 ${ROLE_LABELS[lead.profession] ?? lead.profession}`];
  lines.push(`📱 ${phone} → ${wa}`);
  if (utm) lines.push(`🔗 utm: ${escapeHtml(utm)}`);
  if (lead.referrer) lines.push(`↩️ ${escapeHtml(lead.referrer)}`);
  return lines.join('\n');
}

async function sendTelegram(env: Env, lead: Lead) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) throw new Error('telegram_not_configured');
  const thread = lead.type === 'business' ? env.TG_THREAD_BUSINESS : env.TG_THREAD_CANDIDATE;
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: telegramText(lead),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(thread ? { message_thread_id: Number(thread) } : {}),
    }),
  });
  if (!response.ok) throw new Error(`telegram_${response.status}`);
}

async function sendSheets(env: Env, lead: Lead) {
  if (!env.SHEETS_WEBHOOK_URL) throw new Error('sheets_not_configured');
  const { turnstile_token: _token, company_site: _hp, ...row } = lead;
  const response = await fetch(env.SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.SHEETS_WEBHOOK_SECRET || '',
      sheet: lead.type === 'business' ? 'Leads' : 'Candidates',
      received_at: new Date().toISOString(),
      ...row,
    }),
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`sheets_${response.status}`);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  if (typeof body.company_site === 'string' && body.company_site.trim() !== '') {
    return json({ ok: true });
  }

  if (await isRateLimited(env, ip)) {
    return json({ ok: false, error: 'rate_limited' }, 429);
  }

  const turnstileOk = await verifyTurnstile(env, typeof body.turnstile_token === 'string' ? body.turnstile_token : '', ip).catch(() => false);
  if (!turnstileOk) {
    return json({ ok: false, error: 'captcha' }, 403);
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation', fields: fieldErrors(parsed.error) }, 422);
  }

  const results = await Promise.allSettled([sendTelegram(env, parsed.data), sendSheets(env, parsed.data)]);
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  failures.forEach((failure) => console.error('lead delivery failed:', failure.reason));

  if (failures.length === results.length) {
    return json({ ok: false, error: 'delivery_failed' }, 502);
  }
  return json({ ok: true });
};

export const onRequestGet: PagesFunction<Env> = async () => json({ ok: false, error: 'method_not_allowed' }, 405);
