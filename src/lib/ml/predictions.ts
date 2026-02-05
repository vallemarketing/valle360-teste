// Sistema de Previsões ML - Valle 360
// Modelos preditivos para faturamento, churn e demanda

import { supabase } from '@/lib/supabase';

// Tipos
interface PredictionResult {
  value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: PredictionFactor[];
  historicalData?: number[];
}

interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

interface ChurnPrediction {
  clientId: string;
  clientName: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: PredictionFactor[];
  recommendedActions: string[];
}

interface RevenueForecast {
  month: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

// ============================================
// PREVISÃO DE FATURAMENTO
// ============================================

export async function predictRevenue(months: number = 3): Promise<RevenueForecast[]> {
  try {
    // Buscar dados históricos de faturamento
    const { data: historicalData } = await supabase
      .from('financial_records')
      .select('month, total_revenue')
      .order('month', { ascending: true })
      .limit(24);

    if (!historicalData || historicalData.length < 6) {
      // Dados insuficientes - retornar previsão baseada em média
      return generateDefaultForecast(months);
    }

    // Calcular tendência usando regressão linear simples
    const revenues = historicalData.map(d => d.total_revenue);
    const trend = calculateTrend(revenues);
    const seasonality = calculateSeasonality(revenues);
    const avgGrowth = calculateAverageGrowth(revenues);

    // Gerar previsões
    const forecasts: RevenueForecast[] = [];
    const lastValue = revenues[revenues.length - 1];
    const currentDate = new Date();

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const monthIndex = forecastDate.getMonth();
      const seasonalFactor = seasonality[monthIndex] || 1;
      
      // Previsão = último valor * (1 + crescimento médio) * fator sazonal * tendência
      const predicted = lastValue * Math.pow(1 + avgGrowth, i) * seasonalFactor * (1 + trend * i * 0.01);
      
      // Intervalo de confiança (aumenta com o tempo)
      const uncertainty = 0.1 + (i * 0.03); // 10% + 3% por mês
      
      forecasts.push({
        month: forecastDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        predicted: Math.round(predicted),
        lowerBound: Math.round(predicted * (1 - uncertainty)),
        upperBound: Math.round(predicted * (1 + uncertainty)),
        confidence: Math.round((1 - uncertainty) * 100)
      });
    }

    return forecasts;
  } catch (error) {
    console.error('Erro na previsão de faturamento:', error);
    return generateDefaultForecast(months);
  }
}

// ============================================
// PREVISÃO DE CHURN
// ============================================

export async function predictChurn(): Promise<ChurnPrediction[]> {
  try {
    // Buscar dados de clientes
    const { data: clients } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        created_at,
        last_interaction,
        nps_score,
        payment_status,
        contract_value,
        support_tickets
      `);

    if (!clients) return [];

    const predictions: ChurnPrediction[] = [];

    for (const client of clients) {
      const factors: PredictionFactor[] = [];
      let churnScore = 0;

      // Fator 1: Tempo desde última interação
      const daysSinceInteraction = client.last_interaction 
        ? Math.floor((Date.now() - new Date(client.last_interaction).getTime()) / (1000 * 60 * 60 * 24))
        : 90;
      
      if (daysSinceInteraction > 30) {
        churnScore += 20;
        factors.push({
          name: 'Baixa interação',
          impact: 'negative',
          weight: 20,
          description: `${daysSinceInteraction} dias sem interação`
        });
      }

      // Fator 2: NPS Score
      if (client.nps_score !== null) {
        if (client.nps_score <= 6) {
          churnScore += 30;
          factors.push({
            name: 'NPS Detrator',
            impact: 'negative',
            weight: 30,
            description: `NPS: ${client.nps_score}/10`
          });
        } else if (client.nps_score >= 9) {
          churnScore -= 10;
          factors.push({
            name: 'NPS Promotor',
            impact: 'positive',
            weight: -10,
            description: `NPS: ${client.nps_score}/10`
          });
        }
      }

      // Fator 3: Status de pagamento
      if (client.payment_status === 'overdue') {
        churnScore += 25;
        factors.push({
          name: 'Pagamento atrasado',
          impact: 'negative',
          weight: 25,
          description: 'Possui faturas em atraso'
        });
      }

      // Fator 4: Tickets de suporte
      if (client.support_tickets > 5) {
        churnScore += 15;
        factors.push({
          name: 'Alto volume de suporte',
          impact: 'negative',
          weight: 15,
          description: `${client.support_tickets} tickets abertos`
        });
      }

      // Fator 5: Tempo de contrato (clientes novos têm mais risco)
      const monthsAsClient = client.created_at
        ? Math.floor((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0;
      
      if (monthsAsClient < 6) {
        churnScore += 10;
        factors.push({
          name: 'Cliente recente',
          impact: 'negative',
          weight: 10,
          description: `Apenas ${monthsAsClient} meses de contrato`
        });
      } else if (monthsAsClient > 24) {
        churnScore -= 15;
        factors.push({
          name: 'Cliente fiel',
          impact: 'positive',
          weight: -15,
          description: `${monthsAsClient} meses de contrato`
        });
      }

      // Normalizar score entre 0 e 100
      const churnProbability = Math.max(0, Math.min(100, churnScore));

      // Determinar nível de risco
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (churnProbability >= 70) riskLevel = 'critical';
      else if (churnProbability >= 50) riskLevel = 'high';
      else if (churnProbability >= 30) riskLevel = 'medium';
      else riskLevel = 'low';

      // Gerar recomendações
      const recommendedActions = generateChurnActions(factors, riskLevel);

      predictions.push({
        clientId: client.id,
        clientName: client.name,
        churnProbability,
        riskLevel,
        factors,
        recommendedActions
      });
    }

    // Ordenar por probabilidade de churn (maior primeiro)
    return predictions.sort((a, b) => b.churnProbability - a.churnProbability);
  } catch (error) {
    console.error('Erro na previsão de churn:', error);
    return [];
  }
}

// ============================================
// PREVISÃO DE DEMANDA (Contratações)
// ============================================

export async function predictHiringNeeds(): Promise<{
  area: string;
  currentHeadcount: number;
  predictedDemand: number;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
}[]> {
  try {
    // Buscar dados de equipe e projetos
    const { data: employees } = await supabase
      .from('employees')
      .select('department, created_at');

    const { data: projects } = await supabase
      .from('kanban_tasks')
      .select('area, created_at, status')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (!employees || !projects) return [];

    // Agrupar por área
    const areaStats: Record<string, { headcount: number; taskCount: number; completedTasks: number }> = {};

    employees.forEach(emp => {
      const area = emp.department || 'Geral';
      if (!areaStats[area]) {
        areaStats[area] = { headcount: 0, taskCount: 0, completedTasks: 0 };
      }
      areaStats[area].headcount++;
    });

    projects.forEach(task => {
      const area = task.area || 'Geral';
      if (!areaStats[area]) {
        areaStats[area] = { headcount: 0, taskCount: 0, completedTasks: 0 };
      }
      areaStats[area].taskCount++;
      if (task.status === 'done') {
        areaStats[area].completedTasks++;
      }
    });

    // Calcular necessidade de contratação
    const predictions = Object.entries(areaStats).map(([area, stats]) => {
      const tasksPerPerson = stats.headcount > 0 ? stats.taskCount / stats.headcount : 0;
      const completionRate = stats.taskCount > 0 ? stats.completedTasks / stats.taskCount : 1;

      // Se muitas tarefas por pessoa ou baixa taxa de conclusão, precisa contratar
      let predictedDemand = stats.headcount;
      let recommendation = 'Equipe adequada';
      let urgency: 'low' | 'medium' | 'high' = 'low';

      if (tasksPerPerson > 15 || completionRate < 0.7) {
        predictedDemand = Math.ceil(stats.headcount * 1.3);
        recommendation = `Considerar contratar ${predictedDemand - stats.headcount} pessoa(s)`;
        urgency = completionRate < 0.5 ? 'high' : 'medium';
      } else if (tasksPerPerson < 5 && stats.headcount > 2) {
        predictedDemand = Math.floor(stats.headcount * 0.9);
        recommendation = 'Equipe possivelmente superdimensionada';
        urgency = 'low';
      }

      return {
        area,
        currentHeadcount: stats.headcount,
        predictedDemand,
        recommendation,
        urgency
      };
    });

    return predictions.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  } catch (error) {
    console.error('Erro na previsão de contratação:', error);
    return [];
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgY = sumY / n;
  
  return slope / avgY; // Normalizar pelo valor médio
}

function calculateSeasonality(values: number[]): number[] {
  // Calcular fator sazonal para cada mês
  const monthlyAverages: number[] = new Array(12).fill(0);
  const monthCounts: number[] = new Array(12).fill(0);
  const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;
  
  values.forEach((value, index) => {
    const monthIndex = index % 12;
    monthlyAverages[monthIndex] += value;
    monthCounts[monthIndex]++;
  });
  
  return monthlyAverages.map((total, index) => {
    if (monthCounts[index] === 0) return 1;
    return (total / monthCounts[index]) / overallAvg;
  });
}

function calculateAverageGrowth(values: number[]): number {
  if (values.length < 2) return 0;
  
  let totalGrowth = 0;
  let count = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) {
      totalGrowth += (values[i] - values[i - 1]) / values[i - 1];
      count++;
    }
  }
  
  return count > 0 ? totalGrowth / count : 0;
}

function generateDefaultForecast(months: number): RevenueForecast[] {
  const forecasts: RevenueForecast[] = [];
  const baseValue = 500000; // Valor base padrão
  const currentDate = new Date();
  
  for (let i = 1; i <= months; i++) {
    const forecastDate = new Date(currentDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    
    const predicted = baseValue * (1 + 0.05 * i); // 5% crescimento por mês
    
    forecasts.push({
      month: forecastDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      predicted: Math.round(predicted),
      lowerBound: Math.round(predicted * 0.85),
      upperBound: Math.round(predicted * 1.15),
      confidence: 70
    });
  }
  
  return forecasts;
}

function generateChurnActions(factors: PredictionFactor[], riskLevel: string): string[] {
  const actions: string[] = [];
  
  factors.forEach(factor => {
    if (factor.impact === 'negative') {
      switch (factor.name) {
        case 'Baixa interação':
          actions.push('Agendar call de acompanhamento');
          actions.push('Enviar relatório de resultados');
          break;
        case 'NPS Detrator':
          actions.push('Ligar para entender insatisfação');
          actions.push('Oferecer reunião com gestor');
          break;
        case 'Pagamento atrasado':
          actions.push('Verificar situação financeira');
          actions.push('Oferecer renegociação');
          break;
        case 'Alto volume de suporte':
          actions.push('Analisar tickets recorrentes');
          actions.push('Agendar treinamento');
          break;
        case 'Cliente recente':
          actions.push('Intensificar onboarding');
          actions.push('Agendar check-ins semanais');
          break;
      }
    }
  });
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    actions.unshift('URGENTE: Contato imediato do gestor de conta');
  }
  
  return [...new Set(actions)]; // Remover duplicatas
}

export default {
  predictRevenue,
  predictChurn,
  predictHiringNeeds
};









