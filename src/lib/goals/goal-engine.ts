/**
 * Valle 360 - Motor de Metas Inteligentes
 * Cálculo automático de metas com IA preditiva
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Goals Engine: variáveis NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY não configuradas.'
  );
}

// Goal Engine roda apenas no servidor (via Route Handlers).
const supabase = createClient(
  supabaseUrl || 'https://setup-missing.supabase.co',
  supabaseServiceKey || 'setup-missing',
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }
);

// =====================================================
// TIPOS
// =====================================================

export interface GoalConfig {
  id: string;
  sector: string;
  role?: string;
  metrics: GoalMetric[];
  calculation_method: 'average_plus_growth' | 'fixed' | 'benchmark';
  growth_rate: number;
  min_growth_rate: number;
  max_growth_rate: number;
  seasonal_adjustments: Record<string, number>;
  always_increase: boolean;
  benchmark_source?: string;
}

export interface GoalMetric {
  name: string;
  label: string;
  unit: string;
  weight: number;
  inverse?: boolean; // Se menor é melhor (ex: tempo de entrega)
}

export interface CollaboratorGoal {
  id: string;
  collaborator_id: string;
  collaborator_name: string;
  sector: string;
  period_start: string;
  period_end: string;
  period_type: 'weekly' | 'monthly' | 'quarterly';
  goals: Record<string, { target: number; current: number; unit: string }>;
  overall_progress: number;
  status: 'active' | 'completed' | 'failed' | 'exceeded';
  ai_suggested: boolean;
  ai_confidence: number;
  ai_reasoning: string;
  streak_days: number;
  achievements: string[];
  points_earned: number;
}

export interface ProductionEntry {
  collaborator_id: string;
  sector: string;
  period_date: string;
  metrics: Record<string, number>;
}

export interface GoalSuggestion {
  metric: string;
  suggested_target: number;
  reasoning: string;
  confidence: number;
  factors: string[];
}

// =====================================================
// MOTOR DE CÁLCULO DE METAS
// =====================================================

class GoalEngine {
  private async resolveUserIdFromCollaboratorId(collaboratorId: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('employees')
        .select('user_id')
        .eq('id', collaboratorId)
        .maybeSingle();
      return data?.user_id ? String(data.user_id) : null;
    } catch {
      return null;
    }
  }

  /**
   * Se não existir production_history (ou estiver vazio), calcula um histórico básico a partir de dados reais do sistema.
   * Hoje usamos principalmente Kanban (tarefas concluídas) porque é o dado mais universal em todas as áreas.
   */
  private async getComputedHistoryFromSystem(
    collaboratorId: string,
    sector: string,
    months: number
  ): Promise<ProductionEntry[]> {
    const userId = await this.resolveUserIdFromCollaboratorId(collaboratorId);
    if (!userId) return [];

    const start = new Date();
    start.setMonth(start.getMonth() - months);

    // Base: tarefas concluídas por mês (real). Usamos isso para "pecas"/"posts"/"videos" etc como proxy.
    const { data: tasks } = await supabase
      .from('kanban_tasks')
      .select('id, created_at, updated_at, status, assigned_to, created_by')
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .eq('status', 'done')
      .gte('updated_at', start.toISOString());

    // agrupa por mês (YYYY-MM)
    const buckets = new Map<string, { count: number; avgHours: { sum: number; n: number } }>();
    for (const t of (tasks || []) as any[]) {
      const updatedAt = t.updated_at ? new Date(String(t.updated_at)) : null;
      const createdAt = t.created_at ? new Date(String(t.created_at)) : null;
      if (!updatedAt || Number.isNaN(updatedAt.getTime())) continue;
      const key = `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}`;
      const cur = buckets.get(key) || { count: 0, avgHours: { sum: 0, n: 0 } };
      cur.count += 1;
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const hours = Math.max(0, (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        cur.avgHours.sum += hours;
        cur.avgHours.n += 1;
      }
      buckets.set(key, cur);
    }

    const out: ProductionEntry[] = [];
    for (const [ym, agg] of buckets.entries()) {
      const [y, m] = ym.split('-').map((x) => Number(x));
      const periodDate = new Date(y, (m || 1) - 1, 1).toISOString().slice(0, 10);
      const avgHours = agg.avgHours.n > 0 ? agg.avgHours.sum / agg.avgHours.n : 0;

      // Mapeia métricas mínimas por setor (proxy real via Kanban)
      const metrics: Record<string, number> = {};
      if (sector === 'designer') {
        metrics.pecas = agg.count;
        metrics.tempo_medio = avgHours;
      } else if (sector === 'social_media') {
        metrics.posts = agg.count;
        metrics.stories = Math.round(agg.count * 1.5);
      } else if (sector === 'video_maker') {
        metrics.videos = agg.count;
        metrics.minutos_produzidos = Math.round(agg.count * 3);
      } else if (sector === 'comercial') {
        // proxy mínimo: tarefas done relacionadas a comercial
        metrics.leads_qualificados = agg.count;
      } else {
        metrics.pecas = agg.count;
      }

      out.push({ collaborator_id: collaboratorId, sector, period_date: periodDate, metrics });
    }

    // ordena por data
    out.sort((a, b) => String(a.period_date).localeCompare(String(b.period_date)));
    return out;
  }
  
  /**
   * Calcula metas sugeridas para um colaborador
   */
  async calculateSuggestedGoals(
    collaboratorId: string,
    sector: string,
    periodType: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<GoalSuggestion[]> {
    // 1. Buscar configuração do setor
    const config = await this.getGoalConfig(sector);
    if (!config) {
      throw new Error(`Configuração não encontrada para o setor: ${sector}`);
    }

    // 2. Buscar histórico de produção (preferencial) + fallback para dados reais do sistema (Kanban)
    let history = await this.getProductionHistory(collaboratorId, sector, 3); // últimos 3 meses
    if (!history || history.length === 0) {
      history = await this.getComputedHistoryFromSystem(collaboratorId, sector, 3);
    }

    // 3. Calcular metas por métrica
    const suggestions: GoalSuggestion[] = [];
    const currentMonth = new Date().getMonth() + 1;

    for (const metric of config.metrics) {
      const suggestion = this.calculateMetricGoal(
        metric,
        history,
        config,
        currentMonth
      );
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Calcula meta para uma métrica específica
   */
  private calculateMetricGoal(
    metric: GoalMetric,
    history: ProductionEntry[],
    config: GoalConfig,
    currentMonth: number
  ): GoalSuggestion {
    const factors: string[] = [];
    let confidence = 85;

    // Extrair valores históricos para esta métrica
    const historicalValues = history
      .map(h => h.metrics[metric.name] || 0)
      .filter(v => v > 0);

    // Se não há histórico, usar valor base
    if (historicalValues.length === 0) {
      return {
        metric: metric.name,
        suggested_target: this.getBaselineTarget(metric.name, config.sector),
        reasoning: 'Meta base definida para novos colaboradores',
        confidence: 60,
        factors: ['Sem histórico de produção']
      };
    }

    // Calcular média
    const average = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    factors.push(`Média dos últimos ${historicalValues.length} períodos: ${average.toFixed(1)}`);

    // Calcular tendência
    const trend = this.calculateTrend(historicalValues);
    factors.push(`Tendência: ${trend > 0 ? '+' : ''}${(trend * 100).toFixed(1)}%`);

    // Calcular crescimento base
    let growthRate = config.growth_rate / 100;
    
    // Para comercial, sempre aumentar
    if (config.always_increase) {
      growthRate = Math.max(growthRate, config.min_growth_rate / 100);
      factors.push('Setor comercial: meta sempre crescente');
    }

    // Aplicar tendência ao crescimento
    if (trend > 0) {
      // Se está melhorando, aumentar o desafio
      growthRate = Math.min(growthRate + (trend * 0.5), config.max_growth_rate / 100);
      factors.push('Ajuste positivo por tendência de crescimento');
      confidence += 5;
    } else if (trend < -0.1) {
      // Se está piorando, manter meta mais conservadora
      growthRate = Math.max(growthRate * 0.7, config.min_growth_rate / 100);
      factors.push('Ajuste conservador por queda de desempenho');
      confidence -= 10;
    }

    // Aplicar ajuste sazonal
    const seasonalFactor = config.seasonal_adjustments[String(currentMonth)] || 1;
    if (seasonalFactor !== 1) {
      factors.push(`Ajuste sazonal: ${((seasonalFactor - 1) * 100).toFixed(0)}%`);
    }

    // Calcular meta final
    let suggestedTarget: number;
    
    if (metric.inverse) {
      // Para métricas inversas (menor é melhor), reduzir
      suggestedTarget = average * (1 - growthRate * 0.5) * (2 - seasonalFactor);
      factors.push('Métrica inversa: objetivo é reduzir');
    } else {
      suggestedTarget = average * (1 + growthRate) * seasonalFactor;
    }

    // Arredondar de forma inteligente
    suggestedTarget = this.smartRound(suggestedTarget, metric.unit);

    return {
      metric: metric.name,
      suggested_target: suggestedTarget,
      reasoning: `Baseado na média de ${average.toFixed(1)} ${metric.unit} com crescimento de ${(growthRate * 100).toFixed(0)}%`,
      confidence,
      factors
    };
  }

  /**
   * Calcula tendência de crescimento
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.ceil(values.length / 2));
    
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
    
    if (avgFirst === 0) return 0;
    return (avgSecond - avgFirst) / avgFirst;
  }

  /**
   * Arredondamento inteligente baseado na unidade
   */
  private smartRound(value: number, unit: string): number {
    if (unit === '%') {
      return Math.round(value * 10) / 10; // 1 casa decimal para %
    }
    if (unit === 'R$') {
      return Math.round(value / 100) * 100; // Arredondar para centena
    }
    if (value > 1000) {
      return Math.round(value / 10) * 10; // Arredondar para dezena
    }
    return Math.round(value);
  }

  /**
   * Valor base para novos colaboradores
   */
  private getBaselineTarget(metric: string, sector: string): number {
    const baselines: Record<string, Record<string, number>> = {
      social_media: { posts: 20, stories: 40, engajamento: 3, alcance: 5000 },
      designer: { pecas: 15, revisoes: 2, tempo_medio: 4, satisfacao: 85 },
      trafego: { roas: 3, conversoes: 50, cpc: 2, investimento_gerenciado: 10000 },
      video_maker: { videos: 8, minutos_produzidos: 30, views_total: 10000, satisfacao: 85 },
      comercial: { leads_qualificados: 10, reunioes: 8, propostas: 5, fechamentos: 2 },
      rh: { contratacoes: 2, tempo_vaga: 30, retention_rate: 90, satisfacao_onboarding: 85 }
    };

    return baselines[sector]?.[metric] || 10;
  }

  /**
   * Busca configuração do setor
   */
  async getGoalConfig(sector: string): Promise<GoalConfig | null> {
    const { data, error } = await supabase
      .from('goal_configs')
      .select('*')
      .eq('sector', sector)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar config:', error);
      return null;
    }

    return data as GoalConfig;
  }

  /**
   * Busca histórico de produção
   */
  async getProductionHistory(
    collaboratorId: string,
    sector: string,
    months: number = 3
  ): Promise<ProductionEntry[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('production_history')
      .select('*')
      .eq('collaborator_id', collaboratorId)
      .eq('sector', sector)
      .gte('period_date', startDate.toISOString().split('T')[0])
      .order('period_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Cria meta para colaborador
   */
  async createGoal(
    collaboratorId: string,
    collaboratorName: string,
    sector: string,
    periodType: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<CollaboratorGoal | null> {
    // Calcular período
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (periodType === 'weekly') {
      periodStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Segunda
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
    } else if (periodType === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      const quarter = Math.floor(now.getMonth() / 3);
      periodStart = new Date(now.getFullYear(), quarter * 3, 1);
      periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    }

    // Idempotência: se já existe meta ativa para o mesmo período, atualiza ao invés de duplicar
    const periodStartStr = periodStart.toISOString().split('T')[0];
    const periodEndStr = periodEnd.toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('collaborator_goals')
      .select('id')
      .eq('collaborator_id', collaboratorId)
      .eq('sector', sector)
      .eq('period_type', periodType)
      .eq('period_start', periodStartStr)
      .eq('period_end', periodEndStr)
      .limit(1)
      .maybeSingle();

    // Calcular metas sugeridas
    const suggestions = await this.calculateSuggestedGoals(collaboratorId, sector, periodType);

    // Montar objeto de metas
    const goals: Record<string, { target: number; current: number; unit: string }> = {};
    const config = await this.getGoalConfig(sector);
    
    suggestions.forEach(s => {
      const metric = config?.metrics.find(m => m.name === s.metric);
      goals[s.metric] = {
        target: s.suggested_target,
        current: 0,
        unit: metric?.unit || ''
      };
    });

    // Calcular confiança média
    const avgConfidence = suggestions.reduce((a, b) => a + b.confidence, 0) / suggestions.length;
    const reasoning = suggestions.map(s => `${s.metric}: ${s.reasoning}`).join('; ');

    // Salvar no banco (insert ou update)
    const { data, error } = existing?.id
      ? await supabase
          .from('collaborator_goals')
          .update({
            collaborator_name: collaboratorName,
            goals,
            // mantém progresso atual se já existia (não zera)
            ai_suggested: true,
            ai_confidence: avgConfidence,
            ai_reasoning: reasoning,
            adjustment_reason: null,
            adjusted_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()
      : await supabase
          .from('collaborator_goals')
          .insert({
            collaborator_id: collaboratorId,
            collaborator_name: collaboratorName,
            sector,
            period_start: periodStartStr,
            period_end: periodEndStr,
            period_type: periodType,
            goals,
            overall_progress: 0,
            status: 'active',
            ai_suggested: true,
            ai_confidence: avgConfidence,
            ai_reasoning: reasoning
          })
          .select()
          .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      return null;
    }

    return data as CollaboratorGoal;
  }

  /**
   * Atualiza progresso de uma meta
   */
  async updateProgress(
    goalId: string,
    metricName: string,
    value: number
  ): Promise<{ success: boolean; newProgress: number; alerts: string[] }> {
    const alerts: string[] = [];

    // Buscar meta atual
    const { data: goal, error } = await supabase
      .from('collaborator_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error || !goal) {
      return { success: false, newProgress: 0, alerts: ['Meta não encontrada'] };
    }

    // Atualizar valor da métrica
    const goals = goal.goals as Record<string, { target: number; current: number; unit: string }>;
    if (goals[metricName]) {
      goals[metricName].current = value;
    }

    // Recalcular progresso geral
    const config = await this.getGoalConfig(goal.sector);
    let totalWeight = 0;
    let weightedProgress = 0;

    Object.entries(goals).forEach(([name, data]) => {
      const metric = config?.metrics.find(m => m.name === name);
      const weight = metric?.weight || 1;
      totalWeight += weight;

      let progress: number;
      if (metric?.inverse) {
        // Para métricas inversas, atingir menos que a meta é bom
        progress = data.target > 0 ? Math.min(100, (data.target / data.current) * 100) : 0;
      } else {
        progress = data.target > 0 ? Math.min(100, (data.current / data.target) * 100) : 0;
      }

      weightedProgress += progress * weight;
    });

    const newProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;

    // Verificar status
    let newStatus = goal.status;
    if (newProgress >= 100) {
      newStatus = 'completed';
      alerts.push('🎉 Parabéns! Você completou sua meta!');
    } else if (newProgress >= 120) {
      newStatus = 'exceeded';
      alerts.push('🚀 Incrível! Você superou sua meta em 20%!');
    }

    // Atualizar streak (simplificado)
    const streakDays = newProgress >= 100 / 30 ? (goal.streak_days || 0) + 1 : 0;

    // Verificar se desbloqueou conquistas
    const unlockedAchievements = await this.checkAchievements(
      goal.collaborator_id,
      newProgress,
      streakDays
    );
    if (unlockedAchievements.length > 0) {
      alerts.push(...unlockedAchievements.map(a => `🏆 Conquista desbloqueada: ${a}!`));
    }

    // Salvar atualização
    await supabase
      .from('collaborator_goals')
      .update({
        goals,
        overall_progress: newProgress,
        status: newStatus,
        streak_days: streakDays,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId);

    return { success: true, newProgress, alerts };
  }

  /**
   * Verifica e desbloqueia conquistas
   */
  private async checkAchievements(
    collaboratorId: string,
    progress: number,
    streakDays: number
  ): Promise<string[]> {
    const unlocked: string[] = [];

    // Buscar conquistas disponíveis
    const { data: achievements } = await supabase
      .from('goal_achievements')
      .select('*');

    if (!achievements) return unlocked;

    // Buscar conquistas já desbloqueadas
    const { data: existing } = await supabase
      .from('collaborator_achievements')
      .select('achievement_id')
      .eq('collaborator_id', collaboratorId);

    const existingIds = new Set((existing || []).map(e => e.achievement_id));

    for (const achievement of achievements) {
      if (existingIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as { type: string; value?: number };
      let shouldUnlock = false;

      switch (criteria.type) {
        case 'streak':
          shouldUnlock = streakDays >= (criteria.value || 7);
          break;
        case 'exceed_percentage':
          shouldUnlock = progress >= 100 + (criteria.value || 20);
          break;
        case 'first_goal':
          shouldUnlock = progress >= 100;
          break;
      }

      if (shouldUnlock) {
        await supabase
          .from('collaborator_achievements')
          .insert({
            collaborator_id: collaboratorId,
            achievement_id: achievement.id
          });
        unlocked.push(achievement.name);
      }
    }

    return unlocked;
  }

  /**
   * Gera alerta para colaborador atrasado
   */
  async checkAndCreateAlerts(): Promise<void> {
    // Buscar metas ativas
    const { data: goals } = await supabase
      .from('collaborator_goals')
      .select('*')
      .eq('status', 'active');

    if (!goals) return;

    const today = new Date();

    for (const goal of goals) {
      const periodEnd = new Date(goal.period_end);
      const periodStart = new Date(goal.period_start);
      const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
      const daysElapsed = (today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
      const expectedProgress = (daysElapsed / totalDays) * 100;

      const actualProgress = goal.overall_progress || 0;
      const progressDiff = actualProgress - expectedProgress;

      // Se está muito atrasado (mais de 20% abaixo do esperado)
      if (progressDiff < -20) {
        await supabase
          .from('goal_alerts')
          .insert({
            collaborator_id: goal.collaborator_id,
            goal_id: goal.id,
            type: 'behind_schedule',
            severity: progressDiff < -40 ? 'critical' : 'warning',
            title: 'Meta em risco',
            message: `Você está ${Math.abs(progressDiff).toFixed(0)}% abaixo do esperado para este período. Progresso atual: ${actualProgress.toFixed(0)}%`,
            suggested_action: 'Revisar prioridades e focar nas entregas principais'
          });
      }

      // Se está excedendo (coaching positivo)
      if (progressDiff > 20 && actualProgress > 80) {
        await supabase
          .from('goal_alerts')
          .insert({
            collaborator_id: goal.collaborator_id,
            goal_id: goal.id,
            type: 'exceeding',
            severity: 'success',
            title: 'Excelente desempenho!',
            message: `Você está ${progressDiff.toFixed(0)}% acima do esperado! Continue assim!`,
            suggested_action: 'Manter o ritmo e ajudar colegas se possível'
          });
      }
    }
  }
}

export const goalEngine = new GoalEngine();
export default goalEngine;

