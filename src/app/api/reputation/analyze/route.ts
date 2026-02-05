/**
 * Valle 360 - API Route: Reputation Analysis
 * GET /api/reputation/analyze - Análise consolidada e insights preditivos
 * POST /api/reputation/analyze - Análise de sentimento de texto
 */

import { NextRequest, NextResponse } from 'next/server';
import { reputationService } from '@/lib/integrations/reputation';
import { socialSentimentAnalyzer } from '@/lib/integrations/reputation/social-sentiment';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';
    const clientId = searchParams.get('clientId') || 'default';

    switch (action) {
      case 'overview': {
        const overview = await reputationService.getOverview(clientId);
        return NextResponse.json({ success: true, data: overview });
      }

      case 'reviews': {
        const reviews = await reputationService.getUnifiedReviews(clientId);
        return NextResponse.json({ success: true, data: reviews });
      }

      case 'mentions': {
        const mentions = await socialSentimentAnalyzer.getRecentMentions(clientId);
        const analyzed = await socialSentimentAnalyzer.analyzeMentions(mentions);
        return NextResponse.json({ success: true, data: analyzed });
      }

      case 'social-metrics': {
        const metrics = await socialSentimentAnalyzer.getMetrics(clientId);
        return NextResponse.json({ success: true, data: metrics });
      }

      case 'alerts': {
        const alerts = await socialSentimentAnalyzer.generateAlerts(clientId);
        return NextResponse.json({ success: true, data: alerts });
      }

      case 'predictive': {
        // Gerar insights preditivos baseados nos dados atuais
        const overview = await reputationService.getOverview(clientId);
        const predictions = generatePredictiveInsights(overview);
        return NextResponse.json({ success: true, data: predictions });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro na análise de reputação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, reviewText, sentiment, platform } = body;

    switch (action) {
      case 'analyze-sentiment': {
        if (!text) {
          return NextResponse.json(
            { success: false, error: 'Campo "text" é obrigatório' },
            { status: 400 }
          );
        }
        const analysis = await socialSentimentAnalyzer.analyzeSentiment(text);
        return NextResponse.json({ success: true, data: analysis });
      }

      case 'suggest-response': {
        if (!reviewText || !sentiment) {
          return NextResponse.json(
            { success: false, error: 'Campos "reviewText" e "sentiment" são obrigatórios' },
            { status: 400 }
          );
        }
        const suggestion = await reputationService.generateResponseSuggestion(
          reviewText,
          sentiment,
          platform || 'google'
        );
        return NextResponse.json({ success: true, data: { suggestion } });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro ao processar análise:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Gera insights preditivos baseados na visão geral
 */
function generatePredictiveInsights(overview: any): {
  predictions: {
    id: string;
    type: 'risk' | 'opportunity';
    title: string;
    description: string;
    probability: number;
    impact: 'low' | 'medium' | 'high';
    timeframe: string;
    action?: string;
  }[];
  recommendations: string[];
} {
  const predictions: any[] = [];
  const recommendations: string[] = [];

  // Análise de riscos baseada em pendências
  if (overview.platforms.google.pendingReplies > 2) {
    predictions.push({
      id: 'risk_google_replies',
      type: 'risk',
      title: 'Queda potencial na nota do Google',
      description: `Com ${overview.platforms.google.pendingReplies} reviews sem resposta, sua nota pode cair até 0.3 pontos nas próximas semanas.`,
      probability: 0.65,
      impact: 'medium',
      timeframe: '2-4 semanas',
      action: 'Responder todos os reviews pendentes'
    });
    recommendations.push('Responda os reviews do Google em até 24h para manter boa reputação');
  }

  if (overview.platforms.reclameAqui.pendingComplaints > 0) {
    predictions.push({
      id: 'risk_ra_pending',
      type: 'risk',
      title: 'Risco de queda no Reclame Aqui',
      description: 'Reclamações pendentes por mais de 48h impactam significativamente o selo de reputação.',
      probability: 0.8,
      impact: 'high',
      timeframe: '1 semana',
      action: 'Resolver reclamações pendentes imediatamente'
    });
    recommendations.push('Priorize as reclamações do Reclame Aqui - impacto direto na decisão de compra');
  }

  if (overview.platforms.reclameAqui.solutionRate < 80) {
    predictions.push({
      id: 'risk_ra_solution',
      type: 'risk',
      title: 'Taxa de solução precisa melhorar',
      description: `Taxa atual de ${overview.platforms.reclameAqui.solutionRate}% pode resultar em perda do selo "Bom" ou "Ótimo".`,
      probability: 0.7,
      impact: 'high',
      timeframe: '1 mês'
    });
  }

  // Oportunidades baseadas em bons indicadores
  if (overview.platforms.google.rating >= 4.5) {
    predictions.push({
      id: 'opportunity_google_badge',
      type: 'opportunity',
      title: 'Potencial para selo "Top Rated"',
      description: 'Com sua nota atual, você pode obter destaque nos resultados de busca do Google.',
      probability: 0.75,
      impact: 'medium',
      timeframe: '1-2 meses',
      action: 'Solicitar mais avaliações de clientes satisfeitos'
    });
    recommendations.push('Incentive clientes satisfeitos a deixar avaliações no Google');
  }

  if (overview.platforms.social.sentiment > 0.5) {
    predictions.push({
      id: 'opportunity_social_growth',
      type: 'opportunity',
      title: 'Momentum positivo nas redes sociais',
      description: 'O sentimento positivo atual pode ser aproveitado para campanhas de indicação.',
      probability: 0.6,
      impact: 'medium',
      timeframe: 'Imediato',
      action: 'Lançar programa de indicação'
    });
    recommendations.push('Aproveite o momento positivo para pedir indicações');
  }

  // Recomendações gerais
  if (overview.score < 70) {
    recommendations.push('Agende uma reunião de crise para plano de ação imediato');
  } else if (overview.score < 85) {
    recommendations.push('Monitore diariamente as menções e responda rapidamente');
  } else {
    recommendations.push('Mantenha a consistência no atendimento para preservar a boa reputação');
  }

  return { predictions, recommendations };
}

