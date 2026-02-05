/**
 * API de Teste para CrewAI Robusto
 * Endpoint para testar Enhanced Agent, Crew e Memory System
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { EnhancedAgent } from '@/lib/agency/core/enhanced-agent';
import { EnhancedCrew } from '@/lib/agency/core/enhanced-crew';
import { Task } from '@/lib/agency/core/task';
import { addCrewJob, JobPriority, getJobStatus } from '@/lib/agency/core/task-queue';
import { shortTermMemory } from '@/lib/agency/memory/short-term-memory';
import { midTermMemory } from '@/lib/agency/memory/mid-term-memory';
import { longTermMemory } from '@/lib/agency/memory/long-term-memory';
import { scoreContent } from '@/lib/agency/analytics/content-scorer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/crew/test
 * Testa diferentes componentes do sistema
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    const body = await request.json();
    const { testType, params } = body;

    switch (testType) {
      case 'enhanced_agent':
        return await testEnhancedAgent(params);
      
      case 'enhanced_crew':
        return await testEnhancedCrew(params);
      
      case 'queue_system':
        return await testQueueSystem(params);
      
      case 'memory_system':
        return await testMemorySystem(params);
      
      case 'content_scorer':
        return await testContentScorer(params);
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Tipo de teste inválido' 
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[CrewTest] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * Teste 1: Enhanced Agent
 */
async function testEnhancedAgent(params: any) {
  const agent = new EnhancedAgent({
    id: `test-agent-${Date.now()}`,
    name: 'Test Copywriter',
    role: 'Instagram Content Creator',
    goal: 'Criar legendas envolventes e criativas',
    backstory: 'Especialista com 7 anos de experiência em marketing digital e redes sociais',
    enableReflection: true,
    enableSelfCorrection: true,
    maxRetries: 3,
  });

  const task = params.task || 'Crie uma legenda curta e impactante para um post sobre Black Friday da Nike';
  const context = params.context || 'Tom: Inspirador, Público: Jovens 18-30 anos, Produto: Tênis de corrida';

  const result = await agent.execute(task, context);

  return NextResponse.json({
    success: true,
    testType: 'enhanced_agent',
    result: {
      output: result.output,
      reflection: result.reflection,
      corrected: result.corrected,
      executionTime: result.executionTime,
      tokenUsage: result.tokenUsage,
    },
  });
}

/**
 * Teste 2: Enhanced Crew
 */
async function testEnhancedCrew(params: any) {
  // Criar agentes primeiro
  const strategist = new EnhancedAgent({
    id: 'strategist',
    name: 'Head Strategist',
    role: 'Marketing Strategist',
    goal: 'Criar estratégias de marketing eficazes',
    backstory: 'CMO com 15 anos de experiência',
    enableReflection: true,
  });

  const copywriter = new EnhancedAgent({
    id: 'copywriter',
    name: 'Copywriter Senior',
    role: 'Content Creator',
    goal: 'Escrever textos persuasivos',
    backstory: 'Redator premiado com especialização em conversão',
    enableReflection: true,
  });

  const designer = new EnhancedAgent({
    id: 'designer',
    name: 'Designer Criativo',
    role: 'Visual Designer',
    goal: 'Criar conceitos visuais impactantes',
    backstory: 'Designer com background em branding',
    enableReflection: true,
  });

  // Criar tarefas
  const task1 = new Task({
    id: 'strategy',
    description: 'Defina 3 pilares estratégicos para uma campanha de Black Friday',
    expectedOutput: 'Lista com 3 pilares e justificativa',
    agentId: 'strategist',
  });

  const task2 = new Task({
    id: 'copy',
    description: 'Escreva um texto persuasivo de 50 palavras para a campanha',
    expectedOutput: 'Texto completo com CTA',
    agentId: 'copywriter',
  });

  const task3 = new Task({
    id: 'visual',
    description: 'Descreva o conceito visual ideal para a campanha',
    expectedOutput: 'Descrição detalhada do visual',
    agentId: 'designer',
  });

  // Criar crew
  const crew = new EnhancedCrew({
    id: `test-crew-${Date.now()}`,
    name: 'Test Campaign Crew',
    description: 'Crew de teste para validar execução paralela',
    agents: ['strategist', 'copywriter', 'designer'],
    tasks: [
      {
        id: 'strategy',
        description: 'Defina 3 pilares estratégicos para uma campanha de Black Friday',
        expectedOutput: 'Lista com 3 pilares e justificativa',
        agentId: 'strategist',
      },
      {
        id: 'copy',
        description: 'Escreva um texto persuasivo de 50 palavras para a campanha',
        expectedOutput: 'Texto completo com CTA',
        agentId: 'copywriter',
      },
      {
        id: 'visual',
        description: 'Descreva o conceito visual ideal para a campanha',
        expectedOutput: 'Descrição detalhada do visual',
        agentId: 'designer',
      },
    ],
    process: params.process || 'parallel',
    maxParallelTasks: 3,
    enableDynamicReplanning: true,
  });

  // Adicionar agentes ao crew (as instâncias)
  crew.addAgent(strategist);
  crew.addAgent(copywriter);
  crew.addAgent(designer);

  // Executar
  const result = await crew.kickoff('Tema: Black Friday 2026 - Maior desconto do ano');

  return NextResponse.json({
    success: true,
    testType: 'enhanced_crew',
    result: {
      finalOutput: result.finalOutput,
      totalTokens: result.totalTokens,
      totalTime: result.totalTime,
      taskResults: result.taskResults.map(r => ({
        agentName: r.agentName,
        outputPreview: r.output.substring(0, 200) + '...',
        reflection: r.reflection,
      })),
    },
  });
}

/**
 * Teste 3: Queue System
 */
async function testQueueSystem(params: any) {
  // Adicionar job à fila
  const job = await addCrewJob(
    'test_campaign',
    params.clientId || 'test-client-123',
    {
      campaignName: 'Test Campaign via Queue',
      topic: params.topic || 'Black Friday',
    },
    JobPriority.HIGH
  );

  // Aguardar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verificar status
  const status = await getJobStatus(job.id!);

  return NextResponse.json({
    success: true,
    testType: 'queue_system',
    result: {
      jobId: job.id,
      jobStatus: status,
      message: 'Job adicionado à fila com sucesso! Monitore o progresso via /api/admin/crew/queue/status',
    },
  });
}

/**
 * Teste 4: Memory System
 */
async function testMemorySystem(params: any) {
  const testId = `test-${Date.now()}`;
  
  // 1. Short-term Memory (Redis)
  await shortTermMemory.set(`test:${testId}`, {
    message: 'Teste de short-term memory',
    timestamp: new Date().toISOString(),
  }, 60); // 60 segundos TTL
  
  const shortTermData = await shortTermMemory.get(`test:${testId}`);
  
  // 2. Mid-term Memory (Supabase)
  const clientId = params.clientId || 'test-client-123';
  const campaignHistory = await midTermMemory.getCampaignHistory(clientId, 5);
  
  // 3. Long-term Memory (pgvector)
  const similarLearnings = await longTermMemory.searchSimilarLearnings(
    'Como criar campanhas de sucesso?',
    clientId,
    3
  );

  return NextResponse.json({
    success: true,
    testType: 'memory_system',
    result: {
      shortTerm: {
        stored: shortTermData,
        message: 'Redis funcionando! Dados expiram em 60s',
      },
      midTerm: {
        campaignsFound: campaignHistory?.length || 0,
        latestCampaigns: campaignHistory?.slice(0, 2) || [],
      },
      longTerm: {
        learningsFound: similarLearnings?.length || 0,
        topLearnings: similarLearnings?.slice(0, 2) || [],
      },
    },
  });
}

/**
 * Teste 5: Content Scorer
 */
async function testContentScorer(params: any) {
  const content = params.content || `🏃‍♂️ BLACK FRIDAY NIKE 🔥

Seus pés merecem o melhor! Até 70% OFF em toda linha de tênis de corrida.

Não perca a chance de correr mais rápido, mais longe, com mais estilo.

👟 Frete grátis
⚡ Entrega em 24h
🎁 Brinde surpresa

CORRE! Promoção válida até domingo.

#BlackFriday #Nike #Running #Performance`;

  const score = await scoreContent(content, {
    platform: 'instagram',
    contentType: 'post',
    brandContext: 'Nike - Tom inspirador, Valores: Performance e superação',
    targetAudience: 'Jovens 18-35 anos, praticantes de corrida',
    keywords: ['nike', 'black friday', 'corrida', 'performance'],
  });

  return NextResponse.json({
    success: true,
    testType: 'content_scorer',
    result: {
      content: content.substring(0, 100) + '...',
      score: {
        overall: score.overall,
        clarity: score.clarity,
        persuasion: score.persuasion,
        branding: score.branding,
        seo: score.seo,
        engagement: score.engagement,
        confidence: score.confidence,
        strengths: score.strengths,
        weaknesses: score.weaknesses,
        suggestions: score.suggestions,
      },
    },
  });
}

/**
 * GET /api/admin/crew/test/status
 * Verifica status do sistema
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  try {
    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      await shortTermMemory.set('health-check', { status: 'ok' }, 10);
      const check = await shortTermMemory.get('health-check');
      redisStatus = check ? 'connected' : 'error';
    } catch (error) {
      redisStatus = 'error';
    }

    return NextResponse.json({
      success: true,
      status: {
        redis: redisStatus,
        enhanced_agent: 'ready',
        enhanced_crew: 'ready',
        queue_system: redisStatus === 'connected' ? 'ready' : 'unavailable',
        memory_system: 'ready',
        content_scorer: 'ready',
      },
      message: redisStatus === 'connected' 
        ? '✅ Sistema completamente operacional!' 
        : '⚠️ Redis desconectado. Instale com: brew install redis && redis-server',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
