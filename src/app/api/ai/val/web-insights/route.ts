/**
 * Val Web Insights (Epic 12)
 * Retorna um "quebra-gelo" de pesquisa web baseado no segmento/concorrentes do cliente, com fontes.
 *
 * - Preferência: Perplexity (Sonar) via integration_configs/env
 * - Fallback: Tavily (answer + URLs)
 * - Safe fallback: retorna mensagem sem quebrar quando integrações não estiverem configuradas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { perplexityWebSearch } from '@/lib/integrations/perplexity';
import { tavilyClient } from '@/lib/integrations/tavily/client';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function uniqUrls(urls: string[]) {
  const out: string[] = [];
  for (const u of urls || []) {
    const s = String(u || '').trim();
    if (!s) continue;
    if (!/^https?:\/\//i.test(s)) continue;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function buildQuery(params: {
  companyName?: string;
  industry?: string;
  segment?: string;
  competitors?: string[];
}) {
  const companyName = String(params.companyName || '').trim();
  const industry = String(params.industry || '').trim();
  const segment = String(params.segment || '').trim();
  const competitors = (params.competitors || []).map((c) => String(c).trim()).filter(Boolean).slice(0, 6);

  const topic = segment || industry || 'marketing digital';

  const blocks = [
    `Faça um resumo rápido e acionável (últimos 30 dias) do setor/segmento: "${topic}" no Brasil.`,
    companyName ? `Empresa: ${companyName}.` : null,
    competitors.length ? `Principais concorrentes: ${competitors.join(', ')}.` : null,
    'Formato obrigatório:',
    '- 5 bullets de insights (com contexto em 1 frase cada)',
    '- 3 ações recomendadas para as próximas 2 semanas (bem práticas)',
    'Requisitos:',
    '- Responda em PT-BR.',
    '- Seja objetivo (sem enrolação).',
    '- Forneça fontes/URLs confiáveis (cite URLs).',
  ].filter(Boolean) as string[];

  return blocks.join('\n');
}

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Detectar tipo de usuário (somente cliente recebe "web insights" automático)
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('user_type')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();
    const userType = String((profileData as any)?.user_type || '');
    const isClient = userType === 'client' || userType === 'cliente';
    if (!isClient) {
      return NextResponse.json({ success: true, skip: true });
    }

    // Buscar dados do cliente (segmento/concorrentes)
    let clientRow: any = null;
    {
      // Usa service role para evitar bloqueio por RLS, mas SEMPRE valida ownership via user_id.
      const admin = getSupabaseAdmin();
      const tryRich = await admin
        .from('clients')
        .select('id, company_name, industry, segment, competitors, concorrentes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!tryRich.error) clientRow = tryRich.data;
      else {
        const tryBasic = await admin
          .from('clients')
          .select('id, company_name, industry')
          .eq('user_id', user.id)
          .maybeSingle();
        clientRow = tryBasic.data || null;
      }
    }

    const companyName = String(clientRow?.company_name || '');
    const industry = String(clientRow?.industry || '');
    const segment = String((clientRow as any)?.segment || '');
    const competitorsFromArray = Array.isArray((clientRow as any)?.competitors)
      ? ((clientRow as any).competitors as any[]).map((x) => String(x)).filter(Boolean)
      : [];
    const competitorsFromText =
      typeof (clientRow as any)?.concorrentes === 'string'
        ? String((clientRow as any).concorrentes)
            .split(/[\n,;]+/g)
            .map((x) => x.trim())
            .filter(Boolean)
        : [];
    const competitors = [...competitorsFromArray, ...competitorsFromText];

    const query = buildQuery({ companyName, industry, segment, competitors });

    // 1) Perplexity (preferencial)
    try {
      const web = await perplexityWebSearch({ query });
      return NextResponse.json({
        success: true,
        provider: 'perplexity',
        message: web.answer,
        sources: uniqUrls(web.sources).slice(0, 12),
        generatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      // 2) Fallback Tavily
      try {
        const topic = segment || industry || 'marketing digital';
        const r = await tavilyClient.searchNews(`tendências ${topic} Brasil`, 8);
        const sources = uniqUrls((r.results || []).map((x) => x.url)).slice(0, 12);
        const message =
          (r.answer && String(r.answer).trim()) ||
          `Encontrei ${r.results?.length || 0} fontes sobre "${topic}". Abra as fontes abaixo para detalhes.`;

        return NextResponse.json({
          success: true,
          provider: 'tavily',
          message,
          sources,
          generatedAt: new Date().toISOString(),
          warning: String(e?.message || 'perplexity_failed'),
        });
      } catch (e2: any) {
        // 3) Safe fallback
        return NextResponse.json({
          success: true,
          provider: 'none',
          message:
            'Ainda não consigo gerar insights com fontes neste ambiente (integração de busca web não configurada). ' +
            'Para ativar, conecte **Perplexity (Sonar)** em **Admin → Integrações** (recomendado) ou configure `TAVILY_API_KEY`.',
          sources: [],
          generatedAt: new Date().toISOString(),
          warning: String(e2?.message || e?.message || 'web_insights_unavailable'),
        });
      }
    }
  } catch (error: any) {
    console.error('Erro em /api/ai/val/web-insights:', error);
    return NextResponse.json({ error: 'Erro ao gerar web insights', details: error?.message }, { status: 500 });
  }
}


