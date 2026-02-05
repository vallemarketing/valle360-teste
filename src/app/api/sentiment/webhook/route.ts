/**
 * Valle 360 - Webhook de Análise de Sentimento
 * Para integração com N8N e outros sistemas externos
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAndStore, queueForAnalysis, SentimentSourceType } from '@/lib/ai/sentiment-automation';

export const dynamic = 'force-dynamic';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));
}

function safeUuid(input?: unknown) {
  const s = String(input || '').trim();
  if (s && isUuid(s)) return s;
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Verificar API Key
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Verificar contra chaves configuradas
  const validKeys = [
    process.env.SENTIMENT_WEBHOOK_KEY,
    process.env.N8N_WEBHOOK_KEY,
    process.env.INTERNAL_API_KEY
  ].filter(Boolean);

  // Em desenvolvimento, aceitar qualquer key
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return validKeys.some(key => key === apiKey);
}

// POST - Receber webhook
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyApiKey(request)) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'API Key inválida ou não fornecida'
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      event, // 'new_message', 'new_nps', 'new_feedback', 'new_review', 'new_comment'
      data
    } = body;

    if (!event || !data) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'event e data são obrigatórios'
      }, { status: 400 });
    }

    let sourceType: SentimentSourceType;
    let content: string;
    let sourceId: string;
    let priority = 5;
    const externalSourceIdRaw =
      data?.message_id ||
      data?.response_id ||
      data?.feedback_id ||
      data?.review_id ||
      data?.comment_id ||
      data?.ticket_id ||
      data?.email_id ||
      data?.id ||
      null;
    const clientId = data?.client_id && isUuid(String(data.client_id)) ? String(data.client_id) : undefined;
    const userId = data?.user_id && isUuid(String(data.user_id)) ? String(data.user_id) : undefined;

    // Mapear evento para tipo de fonte
    switch (event) {
      case 'new_message':
        sourceType = 'message';
        content = data.content || data.text || data.message;
        sourceId = safeUuid(data.message_id || data.id);
        priority = 5;
        break;

      case 'new_nps':
      case 'nps_response':
        sourceType = 'nps_response';
        content = data.feedback || data.comment || data.text;
        sourceId = safeUuid(data.response_id || data.id);
        // NPS detractor (0-6) tem prioridade alta
        priority = data.score <= 6 ? 10 : data.score <= 8 ? 5 : 1;
        break;

      case 'new_feedback':
        sourceType = 'feedback';
        content = data.content || data.text || data.feedback;
        sourceId = safeUuid(data.feedback_id || data.id);
        priority = 7;
        break;

      case 'new_review':
        sourceType = 'review';
        content = data.content || data.text || data.review;
        sourceId = safeUuid(data.review_id || data.id);
        // Reviews negativos têm prioridade alta
        priority = data.rating <= 2 ? 10 : data.rating <= 3 ? 5 : 1;
        break;

      case 'new_comment':
      case 'task_comment':
        sourceType = 'task_comment';
        content = data.content || data.text || data.comment;
        sourceId = safeUuid(data.comment_id || data.id);
        priority = 3;
        break;

      case 'support_ticket':
        sourceType = 'support_ticket';
        content = data.description || data.content || data.text;
        sourceId = safeUuid(data.ticket_id || data.id);
        priority = 8;
        break;

      case 'email':
        sourceType = 'email';
        content = data.body || data.content || data.text;
        sourceId = safeUuid(data.email_id || data.id);
        priority = 4;
        break;

      default:
        return NextResponse.json({
          error: 'Bad Request',
          message: `Evento não suportado: ${event}`
        }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'Conteúdo não encontrado nos dados'
      }, { status: 400 });
    }

    // Processar imediatamente ou adicionar à fila
    const immediate = data.immediate === true || data.sync === true;

    if (immediate) {
      // Processar imediatamente
      const result = await analyzeAndStore(
        sourceType,
        sourceId,
        content,
        {
          clientId,
          userId,
          sourceTable: data.source_table,
          provider: data.provider
        }
      );

      return NextResponse.json({
        success: true,
        processed: true,
        result: result ? {
          id: result.id,
          overall_sentiment: result.overall_sentiment,
          score: result.score,
          alert_generated: result.alert_generated
        } : null
      });
    } else {
      // Adicionar à fila
      const queueId = await queueForAnalysis(
        sourceType,
        sourceId,
        content,
        {
          clientId,
          userId,
          sourceTable: data.source_table,
          priority,
          metadata: {
            event,
            external_source_id: externalSourceIdRaw && !isUuid(String(externalSourceIdRaw)) ? String(externalSourceIdRaw) : null,
            ...data
          }
        }
      );

      return NextResponse.json({
        success: true,
        queued: true,
        queue_id: queueId
      });
    }

  } catch (error: any) {
    console.error('Erro no webhook de sentimento:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message
    }, { status: 500 });
  }
}

// GET - Verificar status do webhook
export async function GET(request: NextRequest) {
  // Verificar autenticação
  if (!verifyApiKey(request)) {
    return NextResponse.json({ 
      error: 'Unauthorized'
    }, { status: 401 });
  }

  return NextResponse.json({
    status: 'healthy',
    version: '1.0.0',
    supported_events: [
      'new_message',
      'new_nps',
      'nps_response',
      'new_feedback',
      'new_review',
      'new_comment',
      'task_comment',
      'support_ticket',
      'email'
    ],
    documentation: '/admin/integracoes/api/docs'
  });
}

