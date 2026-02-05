/**
 * Valle AI - Client Health Score Service
 * Sistema de pontuação de saúde do cliente
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export interface ClientHealthScore {
  client_id: string;
  client_name: string;
  overall_score: number; // 0-100
  engagement_score: number;
  payment_score: number;
  satisfaction_score: number;
  growth_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: HealthFactor[];
  recommendations: string[];
  last_calculated: string;
  trend: 'improving' | 'stable' | 'declining';
  churn_probability: number; // 0-100
}

export interface HealthFactor {
  name: string;
  category: 'engagement' | 'payment' | 'satisfaction' | 'growth';
  value: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ClientActivity {
  type: 'login' | 'approval' | 'message' | 'meeting' | 'feedback' | 'payment' | 'support_ticket';
  timestamp: string;
  value?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

class ClientHealthScoreService {
  private db() {
    return getSupabaseAdmin();
  }
  // Pesos para cada categoria
  private readonly WEIGHTS = {
    engagement: 0.25,
    payment: 0.30,
    satisfaction: 0.25,
    growth: 0.20
  };

  /**
   * Calcula o Health Score de um cliente
   */
  async calculateHealthScore(clientId: string): Promise<ClientHealthScore | null> {
    try {
      // Busca dados do cliente
      const { data: client } = await this.db()
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (!client) return null;

      // Calcula cada componente
      const engagementScore = await this.calculateEngagementScore(clientId);
      const paymentScore = await this.calculatePaymentScore(clientId);
      const satisfactionScore = await this.calculateSatisfactionScore(clientId);
      const growthScore = await this.calculateGrowthScore(clientId);

      // Calcula score geral ponderado
      const overallScore = Math.round(
        engagementScore * this.WEIGHTS.engagement +
        paymentScore * this.WEIGHTS.payment +
        satisfactionScore * this.WEIGHTS.satisfaction +
        growthScore * this.WEIGHTS.growth
      );

      // Determina nível de risco
      const riskLevel = this.determineRiskLevel(overallScore);

      // Calcula probabilidade de churn
      const churnProbability = this.calculateChurnProbability(overallScore, {
        engagement: engagementScore,
        payment: paymentScore,
        satisfaction: satisfactionScore,
        growth: growthScore
      });

      // Gera fatores detalhados
      const factors = await this.generateHealthFactors(clientId, {
        engagement: engagementScore,
        payment: paymentScore,
        satisfaction: satisfactionScore,
        growth: growthScore
      });

      // Gera recomendações
      const recommendations = this.generateRecommendations(factors, riskLevel);

      // Determina tendência
      const trend = await this.determineTrend(clientId, overallScore);

      const healthScore: ClientHealthScore = {
        client_id: clientId,
        client_name: client.company_name || client.name,
        overall_score: overallScore,
        engagement_score: engagementScore,
        payment_score: paymentScore,
        satisfaction_score: satisfactionScore,
        growth_score: growthScore,
        risk_level: riskLevel,
        factors,
        recommendations,
        last_calculated: new Date().toISOString(),
        trend,
        churn_probability: churnProbability
      };

      // Salva no banco
      await this.saveHealthScore(healthScore);

      return healthScore;
    } catch (error) {
      console.error('Erro ao calcular Health Score:', error);
      return null;
    }
  }

  /**
   * Calcula score de engajamento
   */
  private async calculateEngagementScore(clientId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Busca atividades do cliente nos últimos 30 dias
      const { data: activities } = await this.db()
        .from('client_activities')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (!activities || activities.length === 0) return 30; // Score baixo se não há atividade

      // Pontuação por tipo de atividade
      const activityPoints: Record<string, number> = {
        login: 5,
        approval: 15,
        message: 10,
        meeting: 20,
        feedback: 15,
        support_ticket: 5
      };

      let totalPoints = 0;
      for (const activity of activities) {
        totalPoints += activityPoints[activity.type] || 5;
      }

      // Normaliza para 0-100
      return Math.min(100, Math.round(totalPoints / 2));
    } catch (error) {
      console.error('Erro ao calcular engagement:', error);
      return 50; // Score médio em caso de erro
    }
  }

  /**
   * Calcula score de pagamento
   */
  private async calculatePaymentScore(clientId: string): Promise<number> {
    try {
      // Busca histórico de faturas
      const { data: invoices } = await this.db()
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(12); // Últimas 12 faturas

      if (!invoices || invoices.length === 0) return 70; // Score neutro se não há faturas

      let score = 100;
      
      for (const invoice of invoices) {
        if (invoice.status === 'overdue') {
          score -= 20; // Penalidade forte por atraso atual
        } else if (invoice.status === 'paid' && invoice.paid_at) {
          const dueDate = new Date(invoice.due_date);
          const paidDate = new Date(invoice.paid_at);
          const daysLate = Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysLate > 0) {
            score -= Math.min(15, daysLate * 2); // Penalidade por pagamento atrasado
          } else {
            score += 5; // Bônus por pagamento antecipado
          }
        }
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Erro ao calcular payment score:', error);
      return 50;
    }
  }

  /**
   * Calcula score de satisfação
   */
  private async calculateSatisfactionScore(clientId: string): Promise<number> {
    try {
      // Busca NPS e feedbacks
      const { data: feedbacks } = await this.db()
        .from('client_feedbacks')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!feedbacks || feedbacks.length === 0) return 60; // Score neutro

      let totalScore = 0;
      let count = 0;

      for (const feedback of feedbacks) {
        if (feedback.nps_score !== null) {
          // NPS vai de 0-10, converte para 0-100
          totalScore += feedback.nps_score * 10;
          count++;
        }
        if (feedback.rating !== null) {
          // Rating vai de 1-5, converte para 0-100
          totalScore += feedback.rating * 20;
          count++;
        }
      }

      if (count === 0) return 60;
      return Math.round(totalScore / count);
    } catch (error) {
      console.error('Erro ao calcular satisfaction:', error);
      return 50;
    }
  }

  /**
   * Calcula score de crescimento
   */
  private async calculateGrowthScore(clientId: string): Promise<number> {
    try {
      // Busca métricas de crescimento
      const { data: metrics } = await this.db()
        .from('client_metrics')
        .select('*')
        .eq('client_id', clientId)
        .order('period', { ascending: false })
        .limit(3);

      if (!metrics || metrics.length < 2) return 50; // Score neutro se não há dados suficientes

      // Compara métricas atuais vs anteriores
      const current = metrics[0];
      const previous = metrics[1];

      let growthFactors = 0;
      let factorCount = 0;

      // Crescimento de seguidores
      if (current.followers && previous.followers) {
        const followerGrowth = ((current.followers - previous.followers) / previous.followers) * 100;
        growthFactors += Math.min(100, Math.max(0, 50 + followerGrowth));
        factorCount++;
      }

      // Crescimento de engajamento
      if (current.engagement_rate && previous.engagement_rate) {
        const engagementGrowth = ((current.engagement_rate - previous.engagement_rate) / previous.engagement_rate) * 100;
        growthFactors += Math.min(100, Math.max(0, 50 + engagementGrowth * 2));
        factorCount++;
      }

      // Crescimento de conversões
      if (current.conversions && previous.conversions) {
        const conversionGrowth = ((current.conversions - previous.conversions) / previous.conversions) * 100;
        growthFactors += Math.min(100, Math.max(0, 50 + conversionGrowth * 1.5));
        factorCount++;
      }

      if (factorCount === 0) return 50;
      return Math.round(growthFactors / factorCount);
    } catch (error) {
      console.error('Erro ao calcular growth:', error);
      return 50;
    }
  }

  /**
   * Determina nível de risco
   */
  private determineRiskLevel(score: number): ClientHealthScore['risk_level'] {
    if (score >= 75) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 25) return 'high';
    return 'critical';
  }

  /**
   * Calcula probabilidade de churn
   */
  private calculateChurnProbability(
    overallScore: number,
    scores: { engagement: number; payment: number; satisfaction: number; growth: number }
  ): number {
    // Modelo simplificado de previsão de churn
    let churnProb = 100 - overallScore;

    // Ajustes baseados em fatores específicos
    if (scores.payment < 40) churnProb += 15;
    if (scores.engagement < 30) churnProb += 10;
    if (scores.satisfaction < 40) churnProb += 15;
    if (scores.growth < 30) churnProb += 5;

    // Fatores positivos
    if (scores.payment > 80) churnProb -= 10;
    if (scores.satisfaction > 80) churnProb -= 15;

    return Math.max(0, Math.min(100, Math.round(churnProb)));
  }

  /**
   * Gera fatores detalhados de saúde
   */
  private async generateHealthFactors(
    clientId: string,
    scores: { engagement: number; payment: number; satisfaction: number; growth: number }
  ): Promise<HealthFactor[]> {
    const factors: HealthFactor[] = [];

    // Engagement factors
    if (scores.engagement >= 70) {
      factors.push({
        name: 'Alto engajamento',
        category: 'engagement',
        value: scores.engagement,
        weight: this.WEIGHTS.engagement,
        impact: 'positive',
        description: 'Cliente muito ativo na plataforma'
      });
    } else if (scores.engagement < 40) {
      factors.push({
        name: 'Baixo engajamento',
        category: 'engagement',
        value: scores.engagement,
        weight: this.WEIGHTS.engagement,
        impact: 'negative',
        description: 'Cliente pouco ativo - risco de desconexão'
      });
    }

    // Payment factors
    if (scores.payment >= 80) {
      factors.push({
        name: 'Excelente histórico de pagamento',
        category: 'payment',
        value: scores.payment,
        weight: this.WEIGHTS.payment,
        impact: 'positive',
        description: 'Pagamentos sempre em dia'
      });
    } else if (scores.payment < 50) {
      factors.push({
        name: 'Histórico de atrasos',
        category: 'payment',
        value: scores.payment,
        weight: this.WEIGHTS.payment,
        impact: 'negative',
        description: 'Frequentes atrasos no pagamento'
      });
    }

    // Satisfaction factors
    if (scores.satisfaction >= 80) {
      factors.push({
        name: 'Alta satisfação',
        category: 'satisfaction',
        value: scores.satisfaction,
        weight: this.WEIGHTS.satisfaction,
        impact: 'positive',
        description: 'Cliente muito satisfeito com os serviços'
      });
    } else if (scores.satisfaction < 50) {
      factors.push({
        name: 'Satisfação em risco',
        category: 'satisfaction',
        value: scores.satisfaction,
        weight: this.WEIGHTS.satisfaction,
        impact: 'negative',
        description: 'Feedbacks indicam insatisfação'
      });
    }

    // Growth factors
    if (scores.growth >= 70) {
      factors.push({
        name: 'Crescimento acelerado',
        category: 'growth',
        value: scores.growth,
        weight: this.WEIGHTS.growth,
        impact: 'positive',
        description: 'Métricas em crescimento constante'
      });
    } else if (scores.growth < 40) {
      factors.push({
        name: 'Estagnação',
        category: 'growth',
        value: scores.growth,
        weight: this.WEIGHTS.growth,
        impact: 'negative',
        description: 'Métricas estagnadas ou em queda'
      });
    }

    return factors;
  }

  /**
   * Gera recomendações baseadas nos fatores
   */
  private generateRecommendations(factors: HealthFactor[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    const negativeFactors = factors.filter(f => f.impact === 'negative');

    for (const factor of negativeFactors) {
      switch (factor.category) {
        case 'engagement':
          recommendations.push('Agendar reunião de alinhamento com o cliente');
          recommendations.push('Enviar relatório de resultados personalizado');
          break;
        case 'payment':
          recommendations.push('Revisar condições de pagamento');
          recommendations.push('Oferecer desconto para regularização');
          break;
        case 'satisfaction':
          recommendations.push('Realizar pesquisa de satisfação detalhada');
          recommendations.push('Agendar call para entender pontos de melhoria');
          break;
        case 'growth':
          recommendations.push('Revisar estratégia atual');
          recommendations.push('Propor novas ações para acelerar resultados');
          break;
      }
    }

    if (riskLevel === 'critical') {
      recommendations.unshift('🚨 AÇÃO URGENTE: Cliente em risco crítico de churn');
      recommendations.push('Escalar para gerência imediatamente');
    } else if (riskLevel === 'high') {
      recommendations.unshift('⚠️ Cliente requer atenção especial');
    }

    return [...new Set(recommendations)].slice(0, 5);
  }

  /**
   * Determina tendência comparando com score anterior
   */
  private async determineTrend(clientId: string, currentScore: number): Promise<ClientHealthScore['trend']> {
    try {
      const { data: previousScore } = await this.db()
        .from('client_health_scores')
        .select('overall_score')
        .eq('client_id', clientId)
        .order('last_calculated', { ascending: false })
        .limit(1)
        .single();

      if (!previousScore) return 'stable';

      const diff = currentScore - previousScore.overall_score;
      if (diff >= 5) return 'improving';
      if (diff <= -5) return 'declining';
      return 'stable';
    } catch {
      return 'stable';
    }
  }

  /**
   * Salva Health Score no banco
   */
  private async saveHealthScore(healthScore: ClientHealthScore): Promise<void> {
    try {
      await this.db()
        .from('client_health_scores')
        .upsert({
          client_id: healthScore.client_id,
          overall_score: healthScore.overall_score,
          engagement_score: healthScore.engagement_score,
          payment_score: healthScore.payment_score,
          satisfaction_score: healthScore.satisfaction_score,
          growth_score: healthScore.growth_score,
          risk_level: healthScore.risk_level,
          factors: healthScore.factors,
          recommendations: healthScore.recommendations,
          trend: healthScore.trend,
          churn_probability: healthScore.churn_probability,
          last_calculated: healthScore.last_calculated
        }, {
          onConflict: 'client_id'
        });
    } catch (error) {
      console.error('Erro ao salvar Health Score:', error);
    }
  }

  /**
   * Busca Health Scores de todos os clientes
   */
  async getAllHealthScores(filters?: {
    risk_level?: string;
    min_churn_probability?: number;
  }): Promise<ClientHealthScore[]> {
    try {
      let query = this.db()
        .from('client_health_scores')
        .select('*')
        .order('overall_score', { ascending: true });

      if (filters?.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }
      if (filters?.min_churn_probability) {
        query = query.gte('churn_probability', filters.min_churn_probability);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar Health Scores:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar Health Scores:', error);
      return [];
    }
  }

  /**
   * Recalcula Health Scores de todos os clientes
   */
  async recalculateAllScores(): Promise<number> {
    try {
      const { data: clients } = await this.db()
        .from('clients')
        .select('id')
        .eq('is_active', true);

      if (!clients) return 0;

      let calculated = 0;
      for (const client of clients) {
        await this.calculateHealthScore(client.id);
        calculated++;
      }

      return calculated;
    } catch (error) {
      console.error('Erro ao recalcular scores:', error);
      return 0;
    }
  }
}

export const clientHealthScore = new ClientHealthScoreService();
export default clientHealthScore;




