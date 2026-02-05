/**
 * Outbound N8N webhook (best-effort)
 *
 * - Não quebra fluxos do app se N8N não estiver configurado.
 * - Usa env vars:
 *   - N8N_OUTBOUND_WEBHOOK_URL (preferencial) ou N8N_WEBHOOK_URL
 *   - N8N_OUTBOUND_WEBHOOK_KEY (opcional) ou N8N_WEBHOOK_KEY (opcional)
 */
export type N8nOutboundEventName =
  | 'prospecting.leads.upserted'
  | 'prospecting.lead.created'
  | 'prospecting.lead.updated'
  | 'prospecting.lead.contacted';

type Payload = {
  event: N8nOutboundEventName;
  occurred_at: string;
  source: 'valle360';
  actor_user_id?: string | null;
  data: Record<string, any>;
};

function getConfig() {
  const url = process.env.N8N_OUTBOUND_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || '';
  const key = process.env.N8N_OUTBOUND_WEBHOOK_KEY || process.env.N8N_WEBHOOK_KEY || '';
  return { url: String(url).trim(), key: String(key).trim() };
}

export function isN8nOutboundConfigured() {
  const { url } = getConfig();
  return !!url;
}

export async function sendN8nOutboundEvent(input: {
  event: N8nOutboundEventName;
  data: Record<string, any>;
  actorUserId?: string | null;
  timeoutMs?: number;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const { url, key } = getConfig();
  if (!url) return { ok: true, skipped: true };

  const timeoutMs = Math.max(500, Math.min(15_000, Number(input.timeoutMs || 6_000)));
  const payload: Payload = {
    event: input.event,
    occurred_at: new Date().toISOString(),
    source: 'valle360',
    actor_user_id: input.actorUserId ?? null,
    data: input.data || {},
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-api-key': key } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, error: `N8N webhook ${res.status}: ${txt || res.statusText}` };
    }
    return { ok: true };
  } catch (e: any) {
    const msg = String(e?.message || e);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}



