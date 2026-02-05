/**
 * Valle 360 - API de Geração de Conteúdo com IA
 * Gera emails, posts, descrições de vagas, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { 
  generateSocialContent, 
  generateEmail,
  generateJobDescription 
} from '@/lib/ai/intelligence-service';
import { generateWithAI } from '@/lib/ai/aiRouter';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(request: NextRequest) {
  // 1) Cookie auth (auth-helpers)
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { user };
  } catch {
    // ignore
  }

  // 2) Bearer token (para quando o app está usando storage local e não cookies)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { user: null as any };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null as any };

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: { user } } = await supabase.auth.getUser(token);
  return { user };
}

// POST - Gerar conteúdo
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, params } = body;

    let result;

    switch (type) {
      case 'social':
        if (!params?.platform || !params?.topic) {
          return NextResponse.json({ 
            error: 'platform e topic são obrigatórios' 
          }, { status: 400 });
        }
        result = await generateSocialContent({
          platform: params.platform,
          topic: params.topic,
          tone: params.tone || 'professional',
          clientBrand: params.clientBrand,
          keywords: params.keywords
        });
        break;

      case 'email':
        if (!params?.type || !params?.recipientName || !params?.context) {
          return NextResponse.json({ 
            error: 'type, recipientName e context são obrigatórios' 
          }, { status: 400 });
        }
        result = await generateEmail({
          type: params.type,
          recipientName: params.recipientName,
          recipientCompany: params.recipientCompany,
          context: params.context,
          tone: params.tone
        });
        break;

      case 'job':
        if (!params?.title || !params?.department) {
          return NextResponse.json({ 
            error: 'title e department são obrigatórios' 
          }, { status: 400 });
        }
        result = await generateJobDescription({
          title: params.title,
          department: params.department,
          level: params.level || 'pleno',
          type: params.type || 'clt',
          skills: params.skills,
          benefits: params.benefits,
          companyDescription: params.companyDescription
        });
        break;

      case 'proposal':
        // Gerar proposta comercial
        result = await generateProposal(params);
        break;

      case 'report':
        // Gerar relatório
        result = await generateReport(params);
        break;

      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      type,
      content: result,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Erro na API de geração:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerar conteúdo',
      details: error.message 
    }, { status: 500 });
  }
}

// Função auxiliar para gerar proposta
async function generateProposal(params: any) {
  const systemPrompt = `Você é um especialista em vendas de serviços de marketing digital.
Crie uma proposta comercial profissional e persuasiva.

Retorne um JSON:
{
  "title": "Título da proposta",
  "introduction": "Parágrafo de introdução personalizado",
  "problemAnalysis": "Análise do problema/necessidade do cliente",
  "solution": "Nossa solução proposta",
  "services": [{ "name": "Serviço", "description": "Descrição", "value": 0 }],
  "benefits": ["Lista de benefícios"],
  "timeline": "Prazo de implementação",
  "investment": { "total": 0, "payment": "Condições de pagamento" },
  "nextSteps": ["Próximos passos"],
  "closing": "Parágrafo de fechamento"
}`;

  const result = await generateWithAI({
    task: 'sales',
    json: true,
    temperature: 0.7,
    maxTokens: 1400,
    entityType: 'proposal_generate',
    entityId: null,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(params) }
    ],
  });

  return result.json || null;
}

// Função auxiliar para gerar relatório
async function generateReport(params: any) {
  const systemPrompt = `Você é um analista de dados de marketing.
Crie um relatório executivo baseado nos dados fornecidos.

Retorne um JSON:
{
  "title": "Título do relatório",
  "executiveSummary": "Resumo executivo (2-3 parágrafos)",
  "highlights": [{ "metric": "Nome", "value": "Valor", "trend": "up/down/stable", "analysis": "Análise" }],
  "analysis": "Análise detalhada",
  "recommendations": ["Lista de recomendações"],
  "nextSteps": ["Próximos passos sugeridos"],
  "conclusion": "Conclusão"
}`;

  const result = await generateWithAI({
    task: 'analysis',
    json: true,
    temperature: 0.5,
    maxTokens: 1600,
    entityType: 'report_generate',
    entityId: null,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(params) }
    ],
  });

  return result.json || null;
}

