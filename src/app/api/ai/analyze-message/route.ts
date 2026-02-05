/**
 * API para análise silenciosa de sentimento em mensagens
 * Chamada de forma assíncrona (fire-and-forget) após envio de mensagens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';
import { analyzeSentiment } from '@/lib/ai/sentiment-analyzer';

interface AnalyzeMessageRequest {
  messageId: string;
  content: string;
  senderId: string;
  senderType: 'client' | 'collaborator' | 'admin' | 'super_admin';
  conversationType: 'group' | 'direct_team' | 'direct_client';
  groupId?: string;
  clientId?: string;
  conversationName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeMessageRequest = await request.json();
    
    const {
      messageId,
      content,
      senderId,
      senderType,
      conversationType,
      groupId,
      clientId,
      conversationName
    } = body;

    // Validar campos obrigatórios
    if (!messageId || !content || !senderId) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: messageId, content, senderId' },
        { status: 400 }
      );
    }

    // Ignorar mensagens muito curtas
    if (content.trim().length < 10) {
      return NextResponse.json({ success: true, skipped: true, reason: 'Mensagem muito curta' });
    }

    const db = getSupabaseAdmin();

    // Analisar sentimento
    let analysisResult: {
      score: number;
      confidence: number;
      overall?: string;
      keywords?: string[];
      entities?: any[];
      summary?: string;
    };
    
    try {
      const result = await analyzeSentiment({ text: content, language: 'pt-BR' });
      analysisResult = {
        score: result.score,
        confidence: result.confidence,
        overall: result.overall,
        keywords: result.details?.keywords || [],
        entities: [],
        summary: undefined
      };
    } catch (error) {
      console.error('[Sentiment] Erro na análise:', error);
      // Fallback para análise simples baseada em palavras-chave
      analysisResult = simpleSentimentAnalysis(content);
    }

    // Determinar sentimento baseado no score
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (analysisResult.score > 0.25) {
      sentiment = 'positive';
    } else if (analysisResult.score < -0.25) {
      sentiment = 'negative';
    }

    // Salvar análise no banco
    const { data: analysis, error: insertError } = await db
      .from('message_sentiment_analysis')
      .insert({
        message_id: messageId,
        conversation_type: conversationType,
        sender_type: senderType,
        sender_id: senderId,
        client_id: clientId || null,
        group_id: groupId || null,
        sentiment,
        score: analysisResult.score,
        confidence: analysisResult.confidence || 0.8,
        entities: analysisResult.entities || [],
        keywords: analysisResult.keywords || [],
        summary: analysisResult.summary || null,
        alert_generated: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Sentiment] Erro ao salvar análise:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    // Gerar alerta se sentimento for negativo e envolver cliente
    if (sentiment === 'negative' && (conversationType === 'direct_client' || clientId)) {
      await generateSentimentAlert(db, analysis, conversationName || 'Conversa', content);
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis?.id,
      sentiment,
      score: analysisResult.score
    });

  } catch (error: any) {
    console.error('[Sentiment] Erro geral:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * Gera alerta de sentimento negativo para o Super Admin
 */
async function generateSentimentAlert(
  db: ReturnType<typeof getSupabaseAdmin>,
  analysis: any,
  conversationName: string,
  messageContent: string
) {
  try {
    const alertTitle = analysis.sender_type === 'client'
      ? `Cliente com sentimento negativo`
      : `Sentimento negativo detectado em conversa com cliente`;

    const description = `Mensagem com tom ${analysis.sentiment} detectada na conversa "${conversationName}". ` +
      `Score: ${analysis.score.toFixed(2)}. ` +
      `Trecho: "${messageContent.slice(0, 100)}${messageContent.length > 100 ? '...' : ''}"`;

    const suggestedAction = analysis.sender_type === 'client'
      ? 'Verificar satisfação do cliente e entrar em contato para resolver possíveis problemas.'
      : 'Revisar comunicação do colaborador e orientar sobre tom adequado.';

    await db.from('sentiment_alerts').insert({
      analysis_id: analysis.id,
      alert_type: analysis.sender_type === 'client' ? 'negative_client' : 'negative_staff',
      severity: analysis.score < -0.5 ? 'high' : 'medium',
      title: alertTitle,
      description,
      conversation_id: analysis.group_id || null,
      conversation_name: conversationName,
      suggested_action: suggestedAction,
      status: 'pending'
    });

    // Atualizar flag de alerta gerado
    await db
      .from('message_sentiment_analysis')
      .update({ alert_generated: true })
      .eq('id', analysis.id);

  } catch (error) {
    console.error('[Sentiment] Erro ao gerar alerta:', error);
  }
}

/**
 * Análise de sentimento simples como fallback
 */
function simpleSentimentAnalysis(text: string): {
  score: number;
  magnitude: number;
  confidence: number;
  keywords: string[];
  entities: any[];
  summary?: string;
} {
  const lowerText = text.toLowerCase();

  // Palavras positivas em português
  const positiveWords = [
    'obrigado', 'obrigada', 'excelente', 'ótimo', 'ótima', 'perfeito', 'perfeita',
    'incrível', 'maravilhoso', 'maravilhosa', 'parabéns', 'adorei', 'amei',
    'satisfeito', 'satisfeita', 'feliz', 'contente', 'bom', 'boa', 'legal',
    'show', 'top', 'demais', 'sensacional', 'fantástico', 'fantástica'
  ];

  // Palavras negativas em português
  const negativeWords = [
    'problema', 'erro', 'falha', 'ruim', 'péssimo', 'péssima', 'horrível',
    'terrível', 'insatisfeito', 'insatisfeita', 'frustrado', 'frustrada',
    'decepcionado', 'decepcionada', 'reclamação', 'reclamar', 'cancelar',
    'atraso', 'atrasado', 'demora', 'demorado', 'não funciona', 'não gostei',
    'raiva', 'absurdo', 'vergonha', 'inaceitável', 'lamentável'
  ];

  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: string[] = [];

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) {
      positiveCount++;
      foundKeywords.push(word);
    }
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) {
      negativeCount++;
      foundKeywords.push(word);
    }
  });

  const total = positiveCount + negativeCount;
  let score = 0;

  if (total > 0) {
    score = (positiveCount - negativeCount) / Math.max(total, 1);
  }

  // Normalizar score entre -1 e 1
  score = Math.max(-1, Math.min(1, score));

  return {
    score,
    magnitude: Math.abs(score) * (total / 5),
    confidence: total > 0 ? 0.6 : 0.3,
    keywords: foundKeywords.slice(0, 5),
    entities: [],
    summary: total > 0 ? `Detectadas ${positiveCount} expressões positivas e ${negativeCount} negativas.` : undefined
  };
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'message-sentiment-analysis',
    timestamp: new Date().toISOString()
  });
}
