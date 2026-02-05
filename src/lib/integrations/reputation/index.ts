/**
 * Valle 360 - Reputation Integrations
 * Central de integrações para gestão de reputação
 */

export * from './google-business';
export * from './reclame-aqui';
export * from './social-sentiment';

import { googleBusinessClient, GoogleBusinessMetrics, GoogleBusinessReview } from './google-business';
import { reclameAquiClient, ReclameAquiMetrics, ReclameAquiComplaint } from './reclame-aqui';
import { socialSentimentAnalyzer, SocialSentimentMetrics, SocialMention } from './social-sentiment';

// =====================================================
// TIPOS CONSOLIDADOS
// =====================================================

export interface ReputationOverview {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'attention' | 'critical';
  platforms: {
    google: {
      rating: number;
      totalReviews: number;
      pendingReplies: number;
    };
    reclameAqui: {
      rating: number;
      solutionRate: number;
      pendingComplaints: number;
      reputation: string;
    };
    social: {
      sentiment: number;
      mentions: number;
      alerts: number;
    };
  };
  trend: 'up' | 'down' | 'stable';
  insights: ReputationInsight[];
}

export interface ReputationInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'success' | 'action';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  platform?: string;
  actionUrl?: string;
}

export interface UnifiedReview {
  id: string;
  platform: 'google' | 'reclame_aqui' | 'instagram' | 'facebook' | 'other';
  authorName: string;
  rating?: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  hasReply: boolean;
  needsAttention: boolean;
}

// =====================================================
// SERVIÇO UNIFICADO DE REPUTAÇÃO
// =====================================================

class ReputationService {
  /**
   * Busca visão geral consolidada da reputação
   */
  async getOverview(clientId: string): Promise<ReputationOverview> {
    const [googleMetrics, raMetrics, socialMetrics] = await Promise.all([
      googleBusinessClient.getMetrics('loc_1'),
      reclameAquiClient.getMetrics(),
      socialSentimentAnalyzer.getMetrics(clientId)
    ]);

    const googlePending = await googleBusinessClient.getUnrepliedReviews('loc_1');
    const raPending = await reclameAquiClient.getPendingComplaints();

    // Calcular score geral (ponderado)
    const googleScore = (googleMetrics.averageRating / 5) * 100;
    const raScore = raMetrics.reputationScore * 10;
    const socialScore = ((socialMetrics.averageSentiment + 1) / 2) * 100;

    const overallScore = Math.round(
      googleScore * 0.4 + raScore * 0.35 + socialScore * 0.25
    );

    let status: ReputationOverview['status'] = 'good';
    if (overallScore >= 85) status = 'excellent';
    else if (overallScore >= 70) status = 'good';
    else if (overallScore >= 50) status = 'attention';
    else status = 'critical';

    // Gerar insights
    const insights = await this.generateInsights(
      googleMetrics,
      raMetrics,
      socialMetrics,
      googlePending.length,
      raPending.length
    );

    return {
      score: overallScore,
      status,
      platforms: {
        google: {
          rating: googleMetrics.averageRating,
          totalReviews: googleMetrics.totalReviews,
          pendingReplies: googlePending.length
        },
        reclameAqui: {
          rating: raMetrics.averageRating,
          solutionRate: raMetrics.solutionRate,
          pendingComplaints: raPending.length,
          reputation: raMetrics.reputation
        },
        social: {
          sentiment: socialMetrics.averageSentiment,
          mentions: socialMetrics.totalMentions,
          alerts: socialMetrics.alertsCount
        }
      },
      trend: this.calculateTrend(socialMetrics.sentimentTrend),
      insights
    };
  }

  /**
   * Busca todos os reviews unificados
   */
  async getUnifiedReviews(clientId: string): Promise<UnifiedReview[]> {
    const [googleReviews, raComplaints, socialMentions] = await Promise.all([
      googleBusinessClient.getReviews('loc_1'),
      reclameAquiClient.getComplaints(),
      socialSentimentAnalyzer.getRecentMentions(clientId)
    ]);

    const unified: UnifiedReview[] = [];

    // Google Reviews
    googleReviews.forEach(review => {
      unified.push({
        id: `google_${review.id}`,
        platform: 'google',
        authorName: review.authorName,
        rating: review.rating,
        text: review.text,
        sentiment: review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'neutral' : 'negative',
        createdAt: review.createTime,
        hasReply: !!review.reply,
        needsAttention: !review.reply && review.rating <= 3
      });
    });

    // Reclame Aqui
    raComplaints.forEach(complaint => {
      unified.push({
        id: `ra_${complaint.id}`,
        platform: 'reclame_aqui',
        authorName: complaint.author.name,
        rating: complaint.rating,
        text: complaint.description,
        sentiment: complaint.status === 'solved' && (complaint.rating || 0) >= 7 
          ? 'positive' 
          : complaint.status === 'pending'
          ? 'negative'
          : 'neutral',
        createdAt: complaint.createdAt,
        hasReply: !!complaint.company.response,
        needsAttention: complaint.status === 'pending'
      });
    });

    // Social Media
    const analyzedMentions = await socialSentimentAnalyzer.analyzeMentions(socialMentions);
    analyzedMentions.forEach(mention => {
      unified.push({
        id: `social_${mention.id}`,
        platform: mention.platform === 'instagram' || mention.platform === 'facebook' 
          ? mention.platform 
          : 'other',
        authorName: mention.authorName,
        text: mention.text,
        sentiment: mention.sentiment || 'neutral',
        createdAt: mention.createdAt,
        hasReply: false,
        needsAttention: mention.sentiment === 'negative' && (mention.isInfluencer || (mention.engagementCount || 0) > 50)
      });
    });

    // Ordenar por data (mais recentes primeiro)
    return unified.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Gera insights inteligentes
   */
  private async generateInsights(
    googleMetrics: GoogleBusinessMetrics,
    raMetrics: ReclameAquiMetrics,
    socialMetrics: SocialSentimentMetrics,
    googlePending: number,
    raPending: number
  ): Promise<ReputationInsight[]> {
    const insights: ReputationInsight[] = [];

    // Insight: Reviews não respondidos no Google
    if (googlePending > 0) {
      insights.push({
        id: 'google_pending',
        type: 'action',
        title: `${googlePending} review${googlePending > 1 ? 's' : ''} sem resposta no Google`,
        description: 'Responder reviews aumenta sua visibilidade e mostra que você se importa com os clientes.',
        priority: googlePending >= 3 ? 'high' : 'medium',
        platform: 'Google',
        actionUrl: '/cliente/reputacao?tab=google'
      });
    }

    // Insight: Reclamações pendentes no RA
    if (raPending > 0) {
      insights.push({
        id: 'ra_pending',
        type: 'warning',
        title: `${raPending} reclamação${raPending > 1 ? 'ões' : ''} pendente${raPending > 1 ? 's' : ''} no Reclame Aqui`,
        description: 'Reclamações não respondidas em até 48h impactam negativamente sua reputação.',
        priority: 'high',
        platform: 'Reclame Aqui',
        actionUrl: '/cliente/reputacao?tab=reclameaqui'
      });
    }

    // Insight: Taxa de solução baixa
    if (raMetrics.solutionRate < 70) {
      insights.push({
        id: 'ra_solution_rate',
        type: 'warning',
        title: 'Taxa de solução abaixo do ideal',
        description: `Sua taxa de solução é ${raMetrics.solutionRate}%. O ideal é acima de 70% para manter boa reputação.`,
        priority: raMetrics.solutionRate < 50 ? 'high' : 'medium',
        platform: 'Reclame Aqui'
      });
    }

    // Insight: Boa avaliação no Google
    if (googleMetrics.averageRating >= 4.5) {
      insights.push({
        id: 'google_success',
        type: 'success',
        title: 'Excelente avaliação no Google!',
        description: `Sua nota ${googleMetrics.averageRating.toFixed(1)} está acima da média. Continue assim!`,
        priority: 'low',
        platform: 'Google'
      });
    }

    // Insight: Sentimento social negativo
    if (socialMetrics.alertsCount > 0) {
      insights.push({
        id: 'social_alerts',
        type: 'warning',
        title: 'Menções negativas detectadas',
        description: `${socialMetrics.alertsCount} menção${socialMetrics.alertsCount > 1 ? 'ões' : ''} negativa${socialMetrics.alertsCount > 1 ? 's' : ''} nas redes sociais requer atenção.`,
        priority: socialMetrics.alertsCount >= 3 ? 'high' : 'medium',
        platform: 'Redes Sociais'
      });
    }

    // Insight: Oportunidade de pedir mais reviews
    if (googleMetrics.totalReviews < 50) {
      insights.push({
        id: 'google_opportunity',
        type: 'opportunity',
        title: 'Oportunidade: aumentar número de reviews',
        description: 'Empresas com mais reviews aparecem mais nas buscas. Incentive seus clientes a avaliar!',
        priority: 'low',
        platform: 'Google'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Calcula tendência baseado nos dados históricos
   */
  private calculateTrend(
    trendData: { period: string; score: number }[]
  ): 'up' | 'down' | 'stable' {
    if (trendData.length < 2) return 'stable';
    
    const recent = trendData[trendData.length - 1].score;
    const previous = trendData[trendData.length - 2].score;
    const diff = recent - previous;
    
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  }

  /**
   * Gera sugestão de resposta com IA
   */
  async generateResponseSuggestion(
    reviewText: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    platform: string
  ): Promise<string> {
    // Em produção, usar OpenAI para gerar resposta personalizada
    
    if (sentiment === 'positive') {
      return `Muito obrigado pelo seu feedback! Ficamos muito felizes em saber que você está satisfeito com nosso trabalho. Conte sempre conosco!`;
    } else if (sentiment === 'negative') {
      return `Lamentamos saber da sua experiência. Gostaríamos de entender melhor o que aconteceu para resolver essa situação. Por favor, entre em contato conosco pelo email atendimento@empresa.com.br para que possamos ajudá-lo.`;
    } else {
      return `Obrigado pelo seu comentário! Se tiver alguma dúvida ou sugestão, estamos à disposição para ajudar.`;
    }
  }
}

// Exportar instância singleton
export const reputationService = new ReputationService();
export default reputationService;

