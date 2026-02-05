/**
 * Valle 360 - API da Val (Assistente de IA)
 * Responde perguntas e executa ações usando GPT-4
 * COM PERSONAS ESPECIALIZADAS POR SETOR
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateWithAI } from '@/lib/ai/aiRouter';
import { getValPersona, buildValPrompt } from '@/lib/ai/val-personas';
import { perplexityWebSearch } from '@/lib/integrations/perplexity';

export const dynamic = 'force-dynamic';

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function inferPersonaFromEmployee(params: { department?: string | null; areas?: string[] | null }) {
  const dept = params.department ? normalizeText(params.department) : '';
  const areas = Array.isArray(params.areas) ? params.areas.map((a) => normalizeText(String(a))) : [];
  const raw = [dept, ...areas].filter(Boolean).join(' ');

  if (raw.includes('comercial') || raw.includes('vendas')) return 'comercial';
  if (raw.includes('financeiro') || raw.includes('finance') || raw.includes('cobranca') || raw.includes('cobran')) return 'financeiro';
  if (raw.includes('rh') || raw.includes('people') || raw.includes('pessoas')) return 'rh';
  if (raw.includes('juridico') || raw.includes('compliance')) return 'juridico';
  if (raw.includes('contratos') || raw.includes('contract')) return 'contratos';
  if (raw.includes('operacao') || raw.includes('operacional') || raw.includes('ops')) return 'operacao';
  if (raw.includes('notificacao') || raw.includes('alert')) return 'notificacoes';
  if (raw.includes('trafego') || raw.includes('ads') || raw.includes('midia') || raw.includes('mídia')) return 'trafego';
  if (raw.includes('social')) return 'social_media';
  if (raw.includes('video') || raw.includes('vídeo')) return 'video_maker';
  if (raw.includes('web')) return 'web_designer';
  if (raw.includes('design')) return 'designer';

  return 'colaborador';
}

function inferTaskFromPersona(personaKey: string) {
  const p = String(personaKey || '').toLowerCase();
  if (p === 'comercial') return 'sales';
  if (p === 'rh') return 'hr';
  if (p === 'financeiro') return 'analysis';
  if (p === 'trafego') return 'analysis';
  if (p === 'social_media') return 'copywriting';
  if (p === 'notificacoes' || p === 'operacao') return 'analysis';
  if (p === 'super_admin' || p === 'admin') return 'strategy';
  return 'general';
}

function wantsWebSearch(message: string) {
  const m = String(message || '');
  // Heurística simples: só dispara quando o usuário explicitamente pede “web/internet/fontes”
  return /(\bpesquis|\bbusca\b|\binternet\b|\bweb\b|\bnot[ií]cia|\batualizad|\bfonte(s)?\b|\blink(s)?\b)/i.test(m);
}

// POST - Conversar com a Val
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Buscar perfil do usuário para determinar persona
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();

    // user_type do banco tende a ser enum (super_admin/admin/hr/finance/manager/employee/client).
    const rawUserType = (profileData?.user_type || 'employee') as string;
    const userName = profileData?.full_name || user.email;
    const companyName = profileData?.company_name;

    // Inferir persona por área do colaborador (department/areas) quando aplicável
    let personaKey: string = rawUserType;
    if (rawUserType === 'finance') personaKey = 'financeiro';
    if (rawUserType === 'hr') personaKey = 'rh';
    if (rawUserType === 'client') personaKey = 'cliente';
    if (rawUserType === 'employee' || rawUserType === 'manager') {
      const { data: emp } = await supabase
        .from('employees')
        .select('department, areas')
        .eq('user_id', user.id)
        .maybeSingle();
      personaKey = inferPersonaFromEmployee({
        department: (emp as any)?.department,
        areas: (emp as any)?.areas,
      });
    }

    // Obter persona especializada
    const persona = getValPersona(personaKey);

    // Buscar dados relevantes baseado no tipo de usuário
    let businessContext: any = {
      currentUser: userName,
      userRole: personaKey,
      currentDate: new Date().toLocaleDateString('pt-BR'),
      currentTime: new Date().toLocaleTimeString('pt-BR'),
      persona: persona.name,
      ...context
    };

    // Dados específicos por tipo de usuário
    if (['super_admin', 'admin'].includes(personaKey)) {
      // Buscar dados de gestão
      const [clientsData, tasksData, alertsData, financialData] = await Promise.all([
        supabase.from('clients').select('id, company_name, contact_email').limit(20),
        supabase.from('tasks').select('*').in('status', ['pending', 'in_progress']).limit(10),
        supabase.from('sentiment_alerts').select('*').eq('status', 'pending').limit(5),
        supabase.from('contracts').select('monthly_value, status').eq('status', 'active')
      ]);

      businessContext = {
        ...businessContext,
        totalClients: clientsData.data?.length || 0,
        recentClients: clientsData.data?.slice(0, 5).map((c: any) => c.company_name || c.contact_email) || [],
        pendingTasks: tasksData.data?.length || 0,
        pendingAlerts: alertsData.data?.length || 0,
        activeContracts: financialData.data?.length || 0,
        monthlyRevenue: financialData.data?.reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0) || 0
      };
    } else if (personaKey === 'comercial') {
      // Buscar dados de vendas
      const [leadsData, proposalsData] = await Promise.all([
        supabase.from('leads').select('*').in('status', ['new', 'contacted', 'qualified']).limit(10),
        supabase.from('proposals').select('*').eq('status', 'pending').limit(5)
      ]);

      businessContext = {
        ...businessContext,
        activeLeads: leadsData.data?.length || 0,
        pendingProposals: proposalsData.data?.length || 0
      };
    } else if (personaKey === 'financeiro') {
      // Buscar dados financeiros
      const [contractsData, pendingPayments] = await Promise.all([
        supabase.from('contracts').select('*').eq('status', 'active'),
        supabase.from('contracts').select('*').eq('status', 'pending_payment')
      ]);

      businessContext = {
        ...businessContext,
        activeContracts: contractsData.data?.length || 0,
        pendingPayments: pendingPayments.data?.length || 0,
        totalPending: pendingPayments.data?.reduce((sum: number, c: any) => sum + (c.monthly_value || 0), 0) || 0
      };
    } else if (personaKey === 'cliente') {
      // Buscar dados do cliente
      let clientRow: any = null;
      {
        const tryRich = await supabase
          .from('clients')
          .select('id, company_name, industry, segment, competitors, concorrentes')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!tryRich.error) clientRow = tryRich.data;
        else {
          const tryBasic = await supabase.from('clients').select('id, company_name, industry').eq('user_id', user.id).maybeSingle();
          clientRow = tryBasic.data || null;
        }
      }

      const clientId = (clientRow as any)?.id as string | undefined;
      const clientIndustry = String((clientRow as any)?.industry || '');
      const clientSegment = String((clientRow as any)?.segment || '');
      const competitorsList: string[] = Array.isArray((clientRow as any)?.competitors)
        ? ((clientRow as any).competitors as any[]).map((x) => String(x)).filter(Boolean)
        : typeof (clientRow as any)?.concorrentes === 'string'
          ? String((clientRow as any).concorrentes)
              .split(/[\n,;]+/g)
              .map((x) => x.trim())
              .filter(Boolean)
          : [];

      const [tasksData, messagesData] = await Promise.all([
        clientId ? supabase.from('kanban_tasks').select('*').eq('client_id', clientId).limit(10) : supabase.from('kanban_tasks').select('*').limit(0),
        supabase.from('messages').select('*').eq('recipient_id', user.id).eq('is_read', false).limit(5)
      ]);

      businessContext = {
        ...businessContext,
        myTasks: tasksData.data?.length || 0,
        unreadMessages: messagesData.data?.length || 0,
        companyName: (clientRow as any)?.company_name || companyName,
        industry: clientIndustry || undefined,
        segment: clientSegment || undefined,
        competitors: competitorsList
      };
    } else {
      // Colaborador genérico - inclui contexto do Kanban para sugestões
      const [myTasksData, kanbanTasksData] = await Promise.all([
        supabase.from('tasks').select('*').eq('assigned_to', user.id).in('status', ['pending', 'in_progress']).limit(10),
        supabase.from('kanban_tasks')
          .select('id, title, priority, due_date, status, column_id, kanban_columns!inner(name, stage_key)')
          .eq('assigned_to', user.id)
          .not('status', 'eq', 'done')
          .order('priority', { ascending: false })
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(15)
      ]);

      // Processar tarefas do kanban para sugestões
      const kanbanTasks = (kanbanTasksData.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.due_date,
        status: t.status,
        column: (t.kanban_columns as any)?.name,
        stage: (t.kanban_columns as any)?.stage_key
      }));

      // Identificar tarefa mais urgente
      const urgentTask = kanbanTasks.find((t: any) => 
        t.priority === 'critical' || t.priority === 'high' || 
        (t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000))
      );

      businessContext = {
        ...businessContext,
        myPendingTasks: myTasksData.data?.length || 0,
        kanbanTasks: kanbanTasks.slice(0, 5),
        totalKanbanTasks: kanbanTasks.length,
        urgentTask: urgentTask ? {
          title: urgentTask.title,
          priority: urgentTask.priority,
          dueDate: urgentTask.dueDate,
          column: urgentTask.column
        } : null,
        suggestedNextTask: urgentTask?.title || kanbanTasks[0]?.title || null
      };
    }

    // Construir prompt especializado
    const systemPrompt = buildValPrompt(personaKey, {
      userName,
      companyName,
      additionalContext: `Contexto do negócio:\n${JSON.stringify(businessContext, null, 2)}`
    });

    // Construir mensagens para o chat
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico se houver
    if (history && Array.isArray(history)) {
      history.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        });
      });
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: message });

    // (Opcional) Busca web com Perplexity (quando o usuário pedir).
    // Fazemos isso antes da IA principal para entregar "fontes" e evitar alucinação.
    let webSearchResult: { answer: string; sources: string[] } | null = null;
    if (wantsWebSearch(message)) {
      try {
        const web = await perplexityWebSearch({ query: message });
        webSearchResult = web || null;
        if (web?.answer) {
          const sourcesBlock = (web.sources || []).slice(0, 8).map((u) => `- ${u}`).join('\n');
          const webBlock =
            `Pesquisa web (Perplexity Sonar) — use como base:\n\n` +
            `${web.answer}\n\n` +
            (sourcesBlock ? `Fontes (URLs):\n${sourcesBlock}\n\n` : '') +
            `Instruções: se você usar essa pesquisa, inclua no final da sua resposta uma seção "Fontes:" com os links (1 por linha).`;

          // Insere antes da mensagem do usuário atual (último item)
          messages.splice(Math.max(1, messages.length - 1), 0, { role: 'system', content: webBlock });
        }
      } catch (e: any) {
        // Best-effort: não bloqueia a Val se a integração não estiver configurada.
        const msg = String(e?.message || '');
        if (msg.includes('PERPLEXITY_API_KEY')) {
          // Se o usuário explicitamente pediu web search mas não está configurado, orienta.
          messages.splice(Math.max(1, messages.length - 1), 0, {
            role: 'system',
            content:
              'Observação: o usuário pediu busca web com fontes, mas Perplexity não está configurado (db/env). Se necessário, responda instruindo a conectar em Admin → Integrações → Perplexity (Sonar).',
          });
        }
      }
    }

    let parsedResponse;
    try {
      const result = await generateWithAI({
        task: inferTaskFromPersona(personaKey) as any,
        json: true,
        temperature: 0.7,
        maxTokens: 1500,
        actorUserId: user.id,
        entityType: 'val',
        entityId: null,
        messages
      });
      parsedResponse = result.json;
    } catch (e: any) {
      const msg = String(e?.message || '');
      const missingAiKey =
        msg.includes('OPENROUTER_API_KEY') ||
        msg.includes('OPENAI_API_KEY') ||
        msg.includes('não configurada') ||
        msg.includes('nao configurada') ||
        msg.includes('não configurado') ||
        msg.includes('nao configurado');

      if (missingAiKey) {
        parsedResponse = {
          message:
            'A IA ainda não está conectada neste ambiente. Para ativar agora, vá em **Admin → Integrações** e conecte **OpenRouter** (recomendado) ou **OpenAI**.\n\nDepois disso eu já consigo responder e automatizar tarefas com a Val.',
          suggestions: ['Abrir Integrações', 'Conectar OpenRouter', 'Conectar OpenAI'],
          actions: [
            { label: 'Abrir Integrações', action: 'open_link', params: { url: '/admin/integracoes' } },
          ],
          mood: 'alert',
        };
      } else {
        parsedResponse = {
          message: 'Não consegui estruturar a resposta em JSON agora. Pode tentar novamente com uma pergunta mais direta?',
          suggestions: [],
          actions: [],
          mood: 'neutral',
        };
      }
    }

    // Adicionar info da persona na resposta
    parsedResponse.persona = {
      name: persona.name,
      title: persona.title,
      emoji: persona.emoji
    };

    // Se houve web search, anexar fontes de forma estruturada (não depende do LLM).
    if (webSearchResult?.sources?.length) {
      (parsedResponse as any).sources = webSearchResult.sources.slice(0, 12);
      (parsedResponse as any).web = { sources: webSearchResult.sources.slice(0, 12) };
    }

    // Registrar interação (ignorar erro se tabela não existir)
    try {
      await supabase.from('val_interactions').insert({
        user_id: user.id,
        user_type: personaKey,
        message: message,
        response: parsedResponse.message,
        persona: persona.name,
        context: businessContext
      });
    } catch {
      // Ignorar erro silenciosamente
    }

    return NextResponse.json({
      success: true,
      // compatibilidade: alguns frontends esperam `message` no root
      message: parsedResponse?.message,
      response: parsedResponse,
      sources: (parsedResponse as any)?.sources || undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erro na API da Val:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar mensagem',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Obter sugestões proativas da Val
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar perfil do usuário
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('user_type, full_name')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();

    const rawUserType = (profileData?.user_type || 'employee') as string;
    let personaKey: string = rawUserType;
    if (rawUserType === 'finance') personaKey = 'financeiro';
    if (rawUserType === 'hr') personaKey = 'rh';
    if (rawUserType === 'client') personaKey = 'cliente';
    if (rawUserType === 'employee' || rawUserType === 'manager') {
      const { data: emp } = await supabase
        .from('employees')
        .select('department, areas')
        .eq('user_id', user.id)
        .maybeSingle();
      personaKey = inferPersonaFromEmployee({
        department: (emp as any)?.department,
        areas: (emp as any)?.areas,
      });
    }
    const persona = getValPersona(personaKey);

    // Buscar dados para sugestões baseado no tipo
    let contextData: any = {};

    if (['super_admin', 'admin'].includes(personaKey)) {
      const [alertsData, tasksData, paymentsData] = await Promise.all([
        supabase.from('sentiment_alerts').select('*').eq('status', 'pending').limit(3),
        supabase.from('tasks').select('*').eq('status', 'overdue').limit(5),
        supabase.from('contracts').select('*').eq('status', 'pending_payment').limit(3)
      ]);

      contextData = {
        pendingAlerts: alertsData.data?.length || 0,
        overdueTasks: tasksData.data?.length || 0,
        pendingPayments: paymentsData.data?.length || 0
      };
    }

    const result = await generateWithAI({
      task: inferTaskFromPersona(personaKey) as any,
      json: true,
      temperature: 0.8,
      maxTokens: 400,
      actorUserId: user.id,
      entityType: 'val_suggestions',
      entityId: null,
      messages: [
        { 
          role: 'system', 
          content: `Você é a ${persona.name}. Gere 2-3 sugestões proativas curtas e relevantes para um ${personaKey}.\nRetorne JSON: { "suggestions": [{ "icon": "emoji", "text": "sugestão curta", "priority": "high/medium/low", "action": "ação_sugerida" }] }`
        },
        { 
          role: 'user', 
          content: JSON.stringify({
            ...contextData,
            currentTime: new Date().toLocaleTimeString('pt-BR'),
            dayOfWeek: new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
          })
        }
      ]
    });

    const parsed = result.json || { suggestions: [] };

    return NextResponse.json({
      success: true,
      persona: {
        name: persona.name,
        title: persona.title,
        emoji: persona.emoji
      },
      quickActions: persona.quickActions,
      suggestions: parsed.suggestions || []
    });

  } catch (error: any) {
    console.error('Erro ao buscar sugestões:', error);
    
    // Fallback com sugestões genéricas
    return NextResponse.json({ 
      success: true,
      suggestions: [
        { icon: '👋', text: 'Olá! Como posso ajudar você hoje?', priority: 'low' }
      ]
    });
  }
}
