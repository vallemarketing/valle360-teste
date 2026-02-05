/**
 * Valle 360 - Serviço de Automação de Análise de Sentimento
 * Processa automaticamente mensagens, feedbacks, NPS, etc.
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { analyzeSentiment, UnifiedSentimentResult } from './sentiment-analyzer';
import { googleNLP } from '@/lib/integrations/google/nlp';

function db() {
  // Server-side only. Route handlers fazem o gate (auth/admin/webhook key) antes de chamar este módulo.
  return getSupabaseAdmin();
}

// =====================================================
// TIPOS
// =====================================================

export type SentimentSourceType = 
  | 'message' 
  | 'nps_response' 
  | 'task_comment' 
  | 'feedback' 
  | 'review'
  | 'support_ticket'
  | 'email';

export interface SentimentAnalysisRecord {
  id: string;
  source_type: SentimentSourceType;
  source_id: string;
  content: string;
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  magnitude?: number;
  confidence: number;
  entities?: Array<{ name: string; type: string; sentiment: string }>;
  keywords?: string[];
  summary?: string;
  client_id?: string;
  user_id?: string;
  alert_generated: boolean;
  analyzed_at: string;
}

export interface SentimentAlert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  client_id?: string;
  client_name?: string;
  suggested_action: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
}

export interface AutomationConfig {
  enabled: boolean;
  provider: 'auto' | 'google' | 'openai' | 'claude';
  alert_on_negative: boolean;
  alert_threshold: number;
  alert_channels: string[];
}

// =====================================================
// CONFIGURAÇÃO PADRÃO
// =====================================================

const DEFAULT_CONFIG: AutomationConfig = {
  enabled: true,
  provider: 'auto',
  alert_on_negative: true,
  alert_threshold: -0.25,
  alert_channels: ['in_app']
};

// =====================================================
// FUNÇÕES PRINCIPAIS
// =====================================================

/**
 * Analisa um texto e salva o resultado no banco
 */
export async function analyzeAndStore(
  sourceType: SentimentSourceType,
  sourceId: string,
  content: string,
  options: {
    clientId?: string;
    userId?: string;
    sourceTable?: string;
    contentCreatedAt?: Date;
    provider?: 'auto' | 'google' | 'openai' | 'claude';
  } = {}
): Promise<SentimentAnalysisRecord | null> {
  const startTime = Date.now();

  try {
    // Obter configuração do cliente ou usar padrão
    const config = options.clientId 
      ? await getClientConfig(options.clientId) 
      : DEFAULT_CONFIG;

    if (!config.enabled) {
      console.log('Análise de sentimento desabilitada para este cliente');
      return null;
    }

    // Realizar análise
    const provider = options.provider || config.provider;
    let analysisResult: UnifiedSentimentResult;

    if (provider === 'google' || provider === 'auto') {
      // Usar Google NLP para análise completa
      const googleResult = await googleNLP.analyzeFullText(content, {
        language: 'pt-BR',
        includeClassification: false
      });

      analysisResult = {
        provider: 'google',
        overall: googleResult.summary.overallSentiment,
        score: googleResult.sentiment.documentSentiment.score,
        confidence: Math.min(googleResult.sentiment.documentSentiment.magnitude / 2, 1),
        details: {
          magnitude: googleResult.sentiment.documentSentiment.magnitude,
          sentences: googleResult.sentiment.sentences.map(s => ({
            text: s.text,
            score: s.sentiment.score
          }))
        },
        processingTime: Date.now() - startTime,
        language: 'pt-BR'
      };

      // Adicionar entidades se disponíveis
      if (googleResult.entities.entities.length > 0) {
        (analysisResult as any).entities = googleResult.summary.mainEntities;
      }
    } else {
      // Usar serviço unificado (OpenAI ou Claude)
      analysisResult = await analyzeSentiment({
        text: content,
        provider: provider as any,
        language: 'pt-BR'
      });
    }

    // Preparar dados para salvar
    const analysisData = {
      source_type: sourceType,
      source_id: sourceId,
      source_table: options.sourceTable,
      content: content,
      content_preview: content.substring(0, 200),
      provider: analysisResult.provider,
      overall_sentiment: analysisResult.overall,
      score: analysisResult.score,
      magnitude: analysisResult.details?.magnitude,
      confidence: analysisResult.confidence,
      emotions: analysisResult.details?.emotions,
      entities: (analysisResult as any).entities,
      keywords: analysisResult.details?.keywords,
      summary: analysisResult.summary,
      client_id: options.clientId,
      user_id: options.userId,
      content_created_at: options.contentCreatedAt?.toISOString(),
      processing_time_ms: Date.now() - startTime,
      alert_generated: false
    };

    // Salvar no banco
    const { data: savedAnalysis, error } = await db()
      .from('sentiment_analyses')
      .insert(analysisData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar análise:', error);
      throw error;
    }

    // Verificar se deve gerar alerta
    if (config.alert_on_negative && analysisResult.score < config.alert_threshold) {
      await generateAlert(savedAnalysis, config);
    }

    // Atualizar estatísticas diárias
    await updateDailyStats(sourceType, analysisResult.overall, options.clientId);

    return savedAnalysis;
  } catch (error) {
    console.error('Erro na análise automática de sentimento:', error);
    
    // Registrar falha na fila se houver
    if (sourceId) {
      await db()
        .from('sentiment_processing_queue')
        .update({ 
          status: 'failed', 
          last_error: (error as Error).message 
        })
        .eq('source_id', sourceId);
    }
    
    return null;
  }
}

/**
 * Adiciona item à fila de processamento
 */
export async function queueForAnalysis(
  sourceType: SentimentSourceType,
  sourceId: string,
  content: string,
  options: {
    clientId?: string;
    userId?: string;
    sourceTable?: string;
    priority?: number;
    metadata?: Record<string, any>;
  } = {}
): Promise<string | null> {
  try {
    const { data, error } = await db().rpc('add_to_sentiment_queue', {
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_source_table: options.sourceTable,
      p_content: content,
      p_client_id: options.clientId,
      p_user_id: options.userId,
      p_priority: options.priority || 0,
      p_metadata: options.metadata
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao adicionar à fila:', error);
    return null;
  }
}

/**
 * Processa próximo item da fila
 */
export async function processNextInQueue(): Promise<SentimentAnalysisRecord | null> {
  try {
    // Pegar próximo item
    const { data: items, error } = await db()
      .rpc('get_next_sentiment_queue_item');

    if (error || !items || items.length === 0) {
      return null;
    }

    const item = items[0];

    // Processar
    const result = await analyzeAndStore(
      item.source_type as SentimentSourceType,
      item.source_id,
      item.content,
      {
        clientId: item.client_id,
        userId: item.user_id,
        sourceTable: item.source_table
      }
    );

    // Atualizar fila
    await db()
      .from('sentiment_processing_queue')
      .update({
        status: result ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        result_id: result?.id
      })
      .eq('id', item.id);

    return result;
  } catch (error) {
    console.error('Erro ao processar fila:', error);
    return null;
  }
}

/**
 * Processa toda a fila pendente
 */
export async function processAllPending(maxItems: number = 100): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  let processed = 0;
  let successful = 0;
  let failed = 0;

  while (processed < maxItems) {
    const result = await processNextInQueue();
    
    if (result === null) {
      // Não há mais itens ou falhou
      break;
    }

    processed++;
    if (result) {
      successful++;
    } else {
      failed++;
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { processed, successful, failed };
}

// =====================================================
// FUNÇÕES DE ALERTA
// =====================================================

/**
 * Gera alerta para sentimento negativo
 */
async function generateAlert(
  analysis: any,
  config: AutomationConfig
): Promise<void> {
  try {
    // Determinar severidade baseada no score
    let severity: 'critical' | 'high' | 'medium' | 'low';
    if (analysis.score < -0.7) severity = 'critical';
    else if (analysis.score < -0.5) severity = 'high';
    else if (analysis.score < -0.3) severity = 'medium';
    else severity = 'low';

    // Determinar tipo de alerta
    let alertType = 'negative_feedback';
    if (analysis.source_type === 'nps_response') alertType = 'nps_detractor';
    else if (analysis.source_type === 'message') alertType = 'negative_message';
    else if (analysis.source_type === 'support_ticket') alertType = 'urgent_ticket';

    // Gerar título baseado no contexto
    const sourceLabels: Record<string, string> = {
      message: 'Mensagem',
      nps_response: 'Resposta NPS',
      task_comment: 'Comentário de Tarefa',
      feedback: 'Feedback',
      review: 'Review',
      support_ticket: 'Ticket de Suporte',
      email: 'Email'
    };

    const title = `⚠️ ${sourceLabels[analysis.source_type] || 'Conteúdo'} com sentimento negativo detectado`;

    // Gerar ação sugerida
    const suggestedActions: Record<string, string> = {
      message: 'Entre em contato com o cliente para entender a insatisfação',
      nps_response: 'Agende uma ligação para recuperar este detrator',
      task_comment: 'Verifique se há problemas na execução do projeto',
      feedback: 'Analise o feedback e crie plano de ação',
      review: 'Responda ao review e ofereça solução',
      support_ticket: 'Priorize a resolução deste ticket',
      email: 'Responda o email com prioridade'
    };

    // Buscar nome do cliente se houver
    let clientName: string | undefined;
    if (analysis.client_id) {
      const { data: client } = await db()
        .from('clients')
        .select('company_name, name')
        .eq('id', analysis.client_id)
        .maybeSingle();
      clientName = (client as any)?.company_name || (client as any)?.name || undefined;
    }

    // Criar alerta
    const alertData = {
      sentiment_analysis_id: analysis.id,
      alert_type: alertType,
      severity,
      title,
      description: `Score de sentimento: ${analysis.score.toFixed(2)}. Conteúdo: "${analysis.content_preview}..."`,
      client_id: analysis.client_id,
      client_name: clientName,
      source_type: analysis.source_type,
      source_content_preview: analysis.content_preview,
      suggested_action: suggestedActions[analysis.source_type] || 'Analise o conteúdo e tome ação apropriada',
      notification_channels: config.alert_channels
    };

    const { data: alert, error } = await db()
      .from('sentiment_alerts')
      .insert(alertData)
      .select()
      .single();

    if (error) throw error;

    // Atualizar análise com referência ao alerta
    await db()
      .from('sentiment_analyses')
      .update({ alert_generated: true, alert_id: alert.id })
      .eq('id', analysis.id);

    // TODO: Enviar notificações pelos canais configurados
    // await sendAlertNotifications(alert, config.alert_channels);

  } catch (error) {
    console.error('Erro ao gerar alerta:', error);
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Obtém configuração de automação do cliente
 */
async function getClientConfig(clientId: string): Promise<AutomationConfig> {
  try {
    const { data, error } = await db()
      .from('sentiment_automation_config')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error || !data) {
      return DEFAULT_CONFIG;
    }

    return {
      enabled: data.enabled,
      provider: data.provider,
      alert_on_negative: data.alert_on_negative,
      alert_threshold: data.alert_threshold,
      alert_channels: data.alert_channels
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Atualiza estatísticas diárias
 */
async function updateDailyStats(
  sourceType: SentimentSourceType,
  sentiment: 'positive' | 'neutral' | 'negative',
  clientId?: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Verificar se já existe registro para hoje
    const { data: existing } = await db()
      .from('sentiment_daily_stats')
      .select('id')
      .eq('date', today)
      .eq('client_id', clientId || null)
      .single();

    const incrementField = `${sentiment}_count`;
    const sourceField = `${sourceType === 'message' ? 'messages' : 
                         sourceType === 'nps_response' ? 'nps' :
                         sourceType === 'task_comment' ? 'tasks' : 'reviews'}_count`;

    if (existing) {
      // Atualizar existente
      await db().rpc('increment_sentiment_stat', {
        p_stat_id: existing.id,
        p_sentiment_field: incrementField,
        p_source_field: sourceField
      });
    } else {
      // Criar novo
      const newStats: any = {
        date: today,
        client_id: clientId,
        total_analyses: 1,
        positive_count: sentiment === 'positive' ? 1 : 0,
        neutral_count: sentiment === 'neutral' ? 1 : 0,
        negative_count: sentiment === 'negative' ? 1 : 0,
        messages_count: sourceType === 'message' ? 1 : 0,
        nps_count: sourceType === 'nps_response' ? 1 : 0,
        tasks_count: sourceType === 'task_comment' ? 1 : 0,
        reviews_count: sourceType === 'review' ? 1 : 0
      };

      await db().from('sentiment_daily_stats').insert(newStats);
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}

// =====================================================
// FUNÇÕES DE INTEGRAÇÃO
// =====================================================

/**
 * Hook para analisar mensagem automaticamente
 * Usar quando uma nova mensagem é criada
 */
export async function onNewMessage(
  messageId: string,
  content: string,
  senderId: string,
  recipientId?: string,
  clientId?: string
): Promise<void> {
  // Adicionar à fila com prioridade média
  await queueForAnalysis('message', messageId, content, {
    userId: senderId,
    clientId: clientId,
    sourceTable: 'messages',
    priority: 5
  });
}

/**
 * Hook para analisar resposta NPS
 */
export async function onNPSResponse(
  responseId: string,
  feedback: string,
  score: number,
  clientId: string
): Promise<void> {
  // NPS detractor (0-6) tem prioridade alta
  const priority = score <= 6 ? 10 : score <= 8 ? 5 : 1;
  
  await queueForAnalysis('nps_response', responseId, feedback, {
    clientId,
    sourceTable: 'nps_responses',
    priority,
    metadata: { nps_score: score }
  });
}

/**
 * Hook para analisar comentário em tarefa
 */
export async function onTaskComment(
  commentId: string,
  content: string,
  userId: string,
  taskId: string,
  clientId?: string
): Promise<void> {
  await queueForAnalysis('task_comment', commentId, content, {
    userId,
    clientId,
    sourceTable: 'task_comments',
    priority: 3,
    metadata: { task_id: taskId }
  });
}

/**
 * Hook para analisar feedback
 */
export async function onFeedback(
  feedbackId: string,
  content: string,
  userId: string,
  feedbackType: string,
  clientId?: string
): Promise<void> {
  await queueForAnalysis('feedback', feedbackId, content, {
    userId,
    clientId,
    sourceTable: 'feedbacks',
    priority: 7,
    metadata: { feedback_type: feedbackType }
  });
}

/**
 * Hook para analisar review/avaliação
 */
export async function onReview(
  reviewId: string,
  content: string,
  rating: number,
  source: string,
  clientId?: string
): Promise<void> {
  // Reviews negativos (1-2 estrelas) têm prioridade alta
  const priority = rating <= 2 ? 10 : rating <= 3 ? 5 : 1;
  
  await queueForAnalysis('review', reviewId, content, {
    clientId,
    sourceTable: 'reviews',
    priority,
    metadata: { rating, source }
  });
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

export const sentimentAutomation = {
  analyzeAndStore,
  queueForAnalysis,
  processNextInQueue,
  processAllPending,
  onNewMessage,
  onNPSResponse,
  onTaskComment,
  onFeedback,
  onReview
};

export default sentimentAutomation;

