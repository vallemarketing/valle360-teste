// Churn Prediction - Valle 360
// Sistema de previsão de churn de clientes

export interface ChurnFactors {
  loginFrequency: number;      // Logins por semana
  lastLogin: Date;             // Último login
  npsScore: number;            // Última nota NPS (0-10)
  paymentHistory: {
    onTime: number;            // Pagamentos em dia
    late: number;              // Pagamentos atrasados
    missed: number;            // Pagamentos não realizados
  };
  engagementScore: number;     // 0-100
  supportTickets: number;      // Tickets abertos últimos 30 dias
  contractAge: number;         // Meses de contrato
  lastInteraction: Date;       // Última interação com equipe
  contentApprovals: {
    approved: number;
    rejected: number;
    pending: number;
  };
  featureUsage: number;        // % de features utilizadas
}

export interface ChurnPrediction {
  clientId: string;
  clientName: string;
  churnProbability: number;    // 0-100%
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mainFactors: {
    factor: string;
    impact: number;            // -100 a +100
    description: string;
  }[];
  recommendations: string[];
  predictedChurnDate?: Date;
  confidence: number;          // 0-100%
  trend: 'improving' | 'stable' | 'declining';
}

export interface ChurnAlert {
  id: string;
  clientId: string;
  clientName: string;
  alertType: 'warning' | 'critical';
  message: string;
  suggestedAction: string;
  createdAt: Date;
  acknowledged: boolean;
}

/**
 * Calcular probabilidade de churn
 */
export function calculateChurnProbability(factors: ChurnFactors): ChurnPrediction {
  let score = 50; // Base score
  const mainFactors: ChurnPrediction['mainFactors'] = [];

  // 1. Frequência de login (peso: 20%)
  const daysSinceLogin = Math.floor((Date.now() - factors.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLogin > 14) {
    const impact = Math.min(30, daysSinceLogin - 14);
    score += impact;
    mainFactors.push({
      factor: 'Inatividade',
      impact: impact,
      description: `${daysSinceLogin} dias sem login`
    });
  } else if (factors.loginFrequency > 3) {
    const impact = -Math.min(15, (factors.loginFrequency - 3) * 3);
    score += impact;
    mainFactors.push({
      factor: 'Engajamento Alto',
      impact: impact,
      description: `${factors.loginFrequency} logins por semana`
    });
  }

  // 2. NPS Score (peso: 25%)
  if (factors.npsScore <= 6) {
    const impact = (6 - factors.npsScore) * 5;
    score += impact;
    mainFactors.push({
      factor: 'NPS Baixo',
      impact: impact,
      description: `NPS ${factors.npsScore} (Detrator)`
    });
  } else if (factors.npsScore >= 9) {
    const impact = -(factors.npsScore - 8) * 5;
    score += impact;
    mainFactors.push({
      factor: 'NPS Alto',
      impact: impact,
      description: `NPS ${factors.npsScore} (Promotor)`
    });
  }

  // 3. Histórico de pagamento (peso: 20%)
  const totalPayments = factors.paymentHistory.onTime + factors.paymentHistory.late + factors.paymentHistory.missed;
  if (totalPayments > 0) {
    const lateRatio = (factors.paymentHistory.late + factors.paymentHistory.missed * 2) / totalPayments;
    if (lateRatio > 0.3) {
      const impact = Math.min(25, lateRatio * 50);
      score += impact;
      mainFactors.push({
        factor: 'Pagamentos Irregulares',
        impact: impact,
        description: `${Math.round(lateRatio * 100)}% de pagamentos com problema`
      });
    }
  }

  // 4. Engajamento geral (peso: 15%)
  if (factors.engagementScore < 40) {
    const impact = (40 - factors.engagementScore) / 2;
    score += impact;
    mainFactors.push({
      factor: 'Baixo Engajamento',
      impact: impact,
      description: `Score de engajamento: ${factors.engagementScore}%`
    });
  } else if (factors.engagementScore > 70) {
    const impact = -(factors.engagementScore - 70) / 3;
    score += impact;
    mainFactors.push({
      factor: 'Alto Engajamento',
      impact: impact,
      description: `Score de engajamento: ${factors.engagementScore}%`
    });
  }

  // 5. Tickets de suporte (peso: 10%)
  if (factors.supportTickets > 3) {
    const impact = Math.min(15, (factors.supportTickets - 3) * 3);
    score += impact;
    mainFactors.push({
      factor: 'Muitos Tickets',
      impact: impact,
      description: `${factors.supportTickets} tickets nos últimos 30 dias`
    });
  }

  // 6. Tempo de contrato (peso: 10%)
  if (factors.contractAge < 3) {
    const impact = (3 - factors.contractAge) * 5;
    score += impact;
    mainFactors.push({
      factor: 'Cliente Novo',
      impact: impact,
      description: `${factors.contractAge} meses de contrato`
    });
  } else if (factors.contractAge > 12) {
    const impact = -Math.min(10, (factors.contractAge - 12) / 2);
    score += impact;
    mainFactors.push({
      factor: 'Cliente Fiel',
      impact: impact,
      description: `${factors.contractAge} meses de contrato`
    });
  }

  // 7. Aprovações de conteúdo
  const totalApprovals = factors.contentApprovals.approved + factors.contentApprovals.rejected + factors.contentApprovals.pending;
  if (totalApprovals > 0) {
    const rejectionRate = factors.contentApprovals.rejected / totalApprovals;
    if (rejectionRate > 0.3) {
      const impact = Math.min(10, rejectionRate * 20);
      score += impact;
      mainFactors.push({
        factor: 'Alta Taxa de Rejeição',
        impact: impact,
        description: `${Math.round(rejectionRate * 100)}% de conteúdos rejeitados`
      });
    }
  }

  // 8. Uso de features
  if (factors.featureUsage < 30) {
    const impact = (30 - factors.featureUsage) / 3;
    score += impact;
    mainFactors.push({
      factor: 'Baixo Uso de Features',
      impact: impact,
      description: `Apenas ${factors.featureUsage}% das features utilizadas`
    });
  }

  // Normalizar score
  const churnProbability = Math.max(0, Math.min(100, score));

  // Determinar nível de risco
  let riskLevel: ChurnPrediction['riskLevel'];
  if (churnProbability >= 80) riskLevel = 'critical';
  else if (churnProbability >= 60) riskLevel = 'high';
  else if (churnProbability >= 40) riskLevel = 'medium';
  else riskLevel = 'low';

  // Gerar recomendações
  const recommendations = generateRecommendations(mainFactors, factors);

  // Calcular data prevista de churn (se probabilidade alta)
  let predictedChurnDate: Date | undefined;
  if (churnProbability >= 60) {
    const daysUntilChurn = Math.max(30, Math.round((100 - churnProbability) * 3));
    predictedChurnDate = new Date(Date.now() + daysUntilChurn * 24 * 60 * 60 * 1000);
  }

  // Determinar tendência (simulado - em produção, comparar com histórico)
  const trend = churnProbability > 60 ? 'declining' : churnProbability < 30 ? 'improving' : 'stable';

  return {
    clientId: '',
    clientName: '',
    churnProbability,
    riskLevel,
    mainFactors: mainFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 5),
    recommendations,
    predictedChurnDate,
    confidence: calculateConfidence(factors),
    trend
  };
}

/**
 * Gerar recomendações baseadas nos fatores
 */
function generateRecommendations(
  factors: ChurnPrediction['mainFactors'],
  rawFactors: ChurnFactors
): string[] {
  const recommendations: string[] = [];

  // Baseado nos fatores de maior impacto
  for (const factor of factors) {
    if (factor.impact <= 0) continue; // Ignorar fatores positivos

    switch (factor.factor) {
      case 'Inatividade':
        recommendations.push('Agendar ligação de acompanhamento para entender situação do cliente');
        recommendations.push('Enviar email com novidades e resultados recentes');
        break;
      case 'NPS Baixo':
        recommendations.push('Agendar reunião urgente para entender insatisfação');
        recommendations.push('Oferecer bônus ou benefício especial');
        break;
      case 'Pagamentos Irregulares':
        recommendations.push('Verificar se há problemas financeiros e oferecer renegociação');
        recommendations.push('Considerar ajuste de plano ou parcelamento');
        break;
      case 'Baixo Engajamento':
        recommendations.push('Enviar tutorial de features não utilizadas');
        recommendations.push('Agendar treinamento personalizado');
        break;
      case 'Muitos Tickets':
        recommendations.push('Analisar tickets para identificar padrões de problemas');
        recommendations.push('Agendar call de suporte dedicado');
        break;
      case 'Cliente Novo':
        recommendations.push('Intensificar onboarding e acompanhamento');
        recommendations.push('Enviar cases de sucesso de clientes similares');
        break;
      case 'Alta Taxa de Rejeição':
        recommendations.push('Revisar briefing e alinhamento de expectativas');
        recommendations.push('Agendar reunião de alinhamento criativo');
        break;
      case 'Baixo Uso de Features':
        recommendations.push('Criar tour guiado das features disponíveis');
        recommendations.push('Enviar dicas semanais de uso da plataforma');
        break;
    }
  }

  // Recomendações gerais se não houver específicas
  if (recommendations.length === 0) {
    recommendations.push('Manter contato regular com o cliente');
    recommendations.push('Enviar relatório de resultados mensalmente');
  }

  // Limitar a 5 recomendações
  return [...new Set(recommendations)].slice(0, 5);
}

/**
 * Calcular confiança da previsão
 */
function calculateConfidence(factors: ChurnFactors): number {
  let confidence = 70; // Base

  // Mais dados = mais confiança
  if (factors.contractAge > 6) confidence += 10;
  if (factors.contractAge > 12) confidence += 5;

  // NPS recente aumenta confiança
  if (factors.npsScore > 0) confidence += 5;

  // Histórico de pagamento completo
  const totalPayments = factors.paymentHistory.onTime + factors.paymentHistory.late + factors.paymentHistory.missed;
  if (totalPayments > 6) confidence += 5;

  // Limitar a 95%
  return Math.min(95, confidence);
}

/**
 * Gerar alertas de churn
 */
export function generateChurnAlerts(predictions: ChurnPrediction[]): ChurnAlert[] {
  const alerts: ChurnAlert[] = [];

  for (const prediction of predictions) {
    if (prediction.riskLevel === 'critical') {
      alerts.push({
        id: `alert-${prediction.clientId}-${Date.now()}`,
        clientId: prediction.clientId,
        clientName: prediction.clientName,
        alertType: 'critical',
        message: `URGENTE: ${prediction.clientName} tem ${prediction.churnProbability}% de chance de cancelar`,
        suggestedAction: prediction.recommendations[0] || 'Contatar cliente imediatamente',
        createdAt: new Date(),
        acknowledged: false
      });
    } else if (prediction.riskLevel === 'high') {
      alerts.push({
        id: `alert-${prediction.clientId}-${Date.now()}`,
        clientId: prediction.clientId,
        clientName: prediction.clientName,
        alertType: 'warning',
        message: `${prediction.clientName} apresenta sinais de risco de churn (${prediction.churnProbability}%)`,
        suggestedAction: prediction.recommendations[0] || 'Agendar contato preventivo',
        createdAt: new Date(),
        acknowledged: false
      });
    }
  }

  return alerts.sort((a, b) => 
    a.alertType === 'critical' ? -1 : b.alertType === 'critical' ? 1 : 0
  );
}

/**
 * Calcular valor em risco (receita que pode ser perdida)
 */
export function calculateRevenueAtRisk(
  predictions: ChurnPrediction[],
  clientRevenue: Record<string, number>
): {
  totalAtRisk: number;
  byRiskLevel: {
    critical: number;
    high: number;
    medium: number;
  };
} {
  const result = {
    totalAtRisk: 0,
    byRiskLevel: {
      critical: 0,
      high: 0,
      medium: 0
    }
  };

  for (const prediction of predictions) {
    const revenue = clientRevenue[prediction.clientId] || 0;
    const weightedRevenue = revenue * (prediction.churnProbability / 100);

    result.totalAtRisk += weightedRevenue;

    if (prediction.riskLevel === 'critical') {
      result.byRiskLevel.critical += weightedRevenue;
    } else if (prediction.riskLevel === 'high') {
      result.byRiskLevel.high += weightedRevenue;
    } else if (prediction.riskLevel === 'medium') {
      result.byRiskLevel.medium += weightedRevenue;
    }
  }

  return result;
}

/**
 * Gerar mensagem da Val sobre churn
 */
export function generateValChurnMessage(prediction: ChurnPrediction): string {
  if (prediction.riskLevel === 'critical') {
    return `🚨 **Alerta Crítico**: ${prediction.clientName} tem ${prediction.churnProbability}% de chance de cancelar!\n\n` +
           `**Principais motivos:**\n${prediction.mainFactors.slice(0, 3).map(f => `• ${f.description}`).join('\n')}\n\n` +
           `**Ação recomendada:** ${prediction.recommendations[0]}`;
  }
  
  if (prediction.riskLevel === 'high') {
    return `⚠️ **Atenção**: ${prediction.clientName} apresenta sinais de risco.\n\n` +
           `Probabilidade de churn: ${prediction.churnProbability}%\n\n` +
           `**Sugestão:** ${prediction.recommendations[0]}`;
  }

  if (prediction.riskLevel === 'medium') {
    return `📊 ${prediction.clientName} está em risco moderado (${prediction.churnProbability}%).\n` +
           `Mantenha o acompanhamento regular.`;
  }

  return `✅ ${prediction.clientName} está saudável! Risco de churn: ${prediction.churnProbability}%`;
}

export default {
  calculateChurnProbability,
  generateChurnAlerts,
  calculateRevenueAtRisk,
  generateValChurnMessage
};









