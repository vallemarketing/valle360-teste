import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

type PerplexityConfig = {
  apiKey: string | null;
  model: string;
};

function normalizeUrlList(input: any): string[] {
  const out: string[] = [];
  const push = (v: any) => {
    if (!v) return;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) out.push(s);
      return;
    }
    if (typeof v === 'object') {
      const u = v.url || v.link || v.href || v.source;
      if (typeof u === 'string' && u.trim()) out.push(u.trim());
    }
  };

  if (Array.isArray(input)) {
    input.forEach(push);
  } else {
    push(input);
  }
  // unique
  return Array.from(new Set(out));
}

function extractUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g) || [];
  // unique + cleanup simples (tirar pontuação final comum)
  const cleaned = matches.map((u) => u.replace(/[.,;]+$/, ''));
  return Array.from(new Set(cleaned));
}

export async function getPerplexityConfig(): Promise<PerplexityConfig> {
  // 1) tenta DB (service role)
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('integration_configs')
      .select('api_key, config, status')
      .eq('integration_id', 'perplexity')
      .maybeSingle();

    const apiKey = data?.api_key ? String(data.api_key) : null;
    const model = String((data as any)?.config?.model || '').trim() || 'sonar';

    if (apiKey) return { apiKey, model };
    // se existir no DB mas sem key, cai pro env
    return { apiKey: process.env.PERPLEXITY_API_KEY || null, model };
  } catch {
    // 2) fallback env
    return { apiKey: process.env.PERPLEXITY_API_KEY || null, model: 'sonar' };
  }
}

export async function perplexityWebSearch(params: {
  query: string;
  model?: string;
  timeoutMs?: number;
}): Promise<{ answer: string; sources: string[] }> {
  const cfg = await getPerplexityConfig();
  const apiKey = cfg.apiKey;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY não configurada (db/env)');
  }

  const model = String(params.model || cfg.model || 'sonar').trim() || 'sonar';
  const timeoutMs = params.timeoutMs ?? 25_000;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'Você é um mecanismo de pesquisa web. Responda em português do Brasil, de forma objetiva. Sempre que possível, inclua fontes confiáveis (URLs).',
          },
          { role: 'user', content: params.query },
        ],
      }),
      signal: controller.signal,
    });

    const raw = await r.text();
    if (!r.ok) {
      throw new Error(`Perplexity error (${r.status}): ${raw.slice(0, 300)}`);
    }

    const data = raw ? JSON.parse(raw) : {};
    const answer: string = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';

    // A API pode retornar citações em formatos diferentes
    const citationsRaw =
      data?.citations ||
      data?.choices?.[0]?.citations ||
      data?.choices?.[0]?.message?.citations ||
      data?.references;

    let sources = normalizeUrlList(citationsRaw);
    if (!sources.length) {
      sources = extractUrlsFromText(answer);
    }

    return { answer: String(answer || '').trim(), sources };
  } finally {
    clearTimeout(t);
  }
}


