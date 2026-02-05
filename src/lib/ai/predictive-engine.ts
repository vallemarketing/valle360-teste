/**
 * Valle AI - Predictive Engine
 * Motor preditivo para análises e previsões
 */

import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export interface Prediction {
  id?: string;
  type:
    | 'churn'
    | 'revenue'
    | 'conversion'
    | 'delay'
    | 'performance'
    | 'upsell'
    | 'payment_risk'
    | 'ltv'
    | 'budget_overrun'
    | 'demand_capacity';
  entity_type: 'client' | 'lead' | 'task' | 'campaign' | 'employee' | 'system';
  entity_id: string;
  entity_name?: string;
  prediction_value: number;
  confidence: number; // 0-100
  factors: PredictionFactor[];
  recommendation?: string;
  created_at: string;
  valid_until: string;
  was_correct?: boolean;
  actual_outcome?: any;
}

export interface PredictionFactor {
  name: string;
  weight: number;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface PredictionConfig {
  type: Prediction['type'];
  lookback_days?: number;
  confidence_threshold?: number;
  include_factors?: boolean;
}

class PredictiveEngineService {
  private db() {
    return getSupabaseAdmin();
  }

  private isMissingTableError(message: string) {
    const m = String(message || '').toLowerCase();
    return (
      m.includes('does not exist') ||
      m.includes('relation') ||
      m.includes('schema cache') ||
      m.includes('could not find the table')
    );
  }

  private clamp(n: number, min = 0, max = 100) {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  private daysBetween(a: Date, b: Date) {
    const ms = a.getTime() - b.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }
  /**
   * Gera previsão de churn para um cliente
   */
  async predictChurn(clientId: string): Promise<Prediction | null> {
    try {
      const factors: PredictionFactor[] = [];
      let churnScore = 30;

      // Base: health score (se existir)
      try {
        const { data: hs } = await this.db()
          .from('client_health_scores')
          .select('churn_probability')
          .eq('client_id', clientId)
          .maybeSingle();
        const base = hs?.churn_probability != null ? Number(hs.churn_probability) : null;
        if (base != null && Number.isFinite(base)) {
          churnScore = this.clamp(base, 0, 100);
          factors.push({
            name: 'Health Score (base)',
            weight: 0.35,
            value: churnScore,
            impact: churnScore >= 60 ? 'negative' : 'neutral',
            description: `Probabilidade de churn (health score): ${Math.round(churnScore)}%`,
          });
        }
      } catch (e: any) {
        if (!this.isMissingTableError(e?.message || '')) {
          // ignore (best-effort)
        }
      }

      // Fator 1: Engajamento
      const engagement = await this.getEngagementMetrics(clientId);
      if (engagement.score < 40) {
        churnScore += 25;
        factors.push({
          name: 'Baixo engajamento',
          weight: 0.25,
          value: engagement.score,
          impact: 'negative',
          description: `Engajamento ${engagement.score}% abaixo da média`
        });
      }

      // Fator 2: Histórico de pagamento
      const payment = await this.getPaymentHistory(clientId);
      if (payment.late_payments > 2) {
        churnScore += 20;
        factors.push({
          name: 'Histórico de atrasos',
          weight: 0.20,
          value: payment.late_payments,
          impact: 'negative',
          description: `${payment.late_payments} pagamentos atrasados nos últimos 6 meses`
        });
      }

      // Fator 3: Tempo sem contato
      const lastContact = await this.getLastContactDate(clientId);
      const daysSinceContact = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceContact > 14) {
        churnScore += 15;
        factors.push({
          name: 'Sem contato recente',
          weight: 0.15,
          value: daysSinceContact,
          impact: 'negative',
          description: `${daysSinceContact} dias sem interação`
        });
      }

      // Fator 4: NPS/Satisfação
      const satisfaction = await this.getSatisfactionScore(clientId);
      if (satisfaction < 7) {
        churnScore += 20;
        factors.push({
          name: 'Baixa satisfação',
          weight: 0.20,
          value: satisfaction,
          impact: 'negative',
          description: `NPS ${satisfaction}/10`
        });
      }

      // Fator 5: Tendência de métricas
      const metrics = await this.getMetricsTrend(clientId);
      if (metrics.trend === 'declining') {
        churnScore += 20;
        factors.push({
          name: 'Métricas em queda',
          weight: 0.20,
          value: metrics.change,
          impact: 'negative',
          description: `Queda de ${Math.abs(metrics.change)}% nas métricas`
        });
      }

      churnScore = this.clamp(churnScore, 0, 100);

      // Calcula confiança baseada na quantidade de evidências
      const confidence = Math.min(95, 45 + factors.length * 10);

      const prediction: Prediction = {
        type: 'churn',
        entity_type: 'client',
        entity_id: clientId,
        prediction_value: churnScore,
        confidence,
        factors,
        recommendation: this.generateChurnRecommendation(churnScore, factors),
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (error) {
      console.error('Erro ao prever churn:', error);
      return null;
    }
  }

  /**
   * Gera previsão de conversão para um lead
   */
  async predictConversion(leadId: string): Promise<Prediction | null> {
    try {
      const factors: PredictionFactor[] = [];
      let conversionScore = 50; // Base

      // Fator 1: Score do lead
      let lead: any = null;
      try {
        const { data } = await this.db().from('prospecting_leads').select('*').eq('id', leadId).maybeSingle();
        lead = data || null;
      } catch (e: any) {
        if (!this.isMissingTableError(e?.message || '')) throw e;
      }
      if (!lead) {
        const { data } = await this.db().from('leads').select('*').eq('id', leadId).maybeSingle();
        lead = data || null;
      }

      if (!lead) return null;

      const leadScore = Number(lead.score ?? lead.qualification_score ?? 0);

      if (leadScore >= 80) {
        conversionScore += 20;
        factors.push({
          name: 'Lead qualificado',
          weight: 0.25,
          value: leadScore,
          impact: 'positive',
          description: `Score ${leadScore}/100`
        });
      }

      // Fator 2: Indústria
      const industryConversionRates: Record<string, number> = {
        'E-commerce': 0.35,
        'SaaS': 0.40,
        'Varejo': 0.25,
        'Tecnologia': 0.45,
        'Saúde': 0.30
      };
      const industry = String(lead.industry || lead.company_industry || lead.segment || 'Outros');
      const industryRate = industryConversionRates[industry] || 0.25;
      conversionScore += industryRate * 30;
      factors.push({
        name: 'Taxa do setor',
        weight: 0.20,
        value: industryRate * 100,
        impact: industryRate > 0.30 ? 'positive' : 'neutral',
        description: `Setor ${industry} com taxa de ${(industryRate * 100).toFixed(0)}%`
      });

      // Fator 3: Interações
      const interactions = await this.getLeadInteractions(leadId);
      if (interactions.total >= 3) {
        conversionScore += 15;
        factors.push({
          name: 'Múltiplas interações',
          weight: 0.20,
          value: interactions.total,
          impact: 'positive',
          description: `${interactions.total} interações registradas`
        });
      }

      // Fator 4: Tempo no pipeline
      const daysInPipeline = Math.floor(
        (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysInPipeline > 30) {
        conversionScore -= 10;
        factors.push({
          name: 'Lead antigo',
          weight: 0.15,
          value: daysInPipeline,
          impact: 'negative',
          description: `${daysInPipeline} dias no pipeline`
        });
      }

      const confidence = Math.min(90, 40 + factors.length * 12);
      conversionScore = this.clamp(conversionScore, 0, 100);

      const prediction: Prediction = {
        type: 'conversion',
        entity_type: 'lead',
        entity_id: leadId,
        entity_name: lead.company_name || lead.name || undefined,
        prediction_value: conversionScore,
        confidence,
        factors,
        recommendation: this.generateConversionRecommendation(conversionScore, lead),
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (error) {
      console.error('Erro ao prever conversão:', error);
      return null;
    }
  }

  /**
   * Gera previsão de atraso para uma tarefa
   */
  async predictDelay(taskId: string): Promise<Prediction | null> {
    try {
      const { data: task } = await this.db()
        .from('kanban_tasks')
        .select('id, title, assigned_to, priority, estimated_hours, due_date, created_at, updated_at, column_id, board_id, status')
        .eq('id', taskId)
        .maybeSingle();

      if (!task) return null;

      const factors: PredictionFactor[] = [];
      let delayProbability = 20; // Base

      // Fator 1: Histórico do responsável
      if (task.assigned_to) {
        const history = await this.getEmployeeDeliveryHistory(task.assigned_to);
        if (history.late_rate > 20) {
          delayProbability += history.late_rate * 0.5;
          factors.push({
            name: 'Histórico de atrasos',
            weight: 0.30,
            value: history.late_rate,
            impact: 'negative',
            description: `${history.late_rate}% de entregas atrasadas`
          });
        }
      }

      // Fator 2: Complexidade
      if (task.priority === 'high' || task.estimated_hours > 8) {
        delayProbability += 15;
        factors.push({
          name: 'Alta complexidade',
          weight: 0.25,
          value: task.estimated_hours || 8,
          impact: 'negative',
          description: `Tarefa estimada em ${task.estimated_hours || 8}h`
        });
      }

      // Fator 3: Proximidade do prazo
      if (task.due_date) {
        const daysUntilDue = Math.floor(
          (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue < 2 && (task as any).status !== 'done') {
          delayProbability += 25;
          factors.push({
            name: 'Prazo iminente',
            weight: 0.25,
            value: daysUntilDue,
            impact: 'negative',
            description: `Apenas ${daysUntilDue} dias até o prazo`
          });
        }
      }

      const confidence = Math.min(85, 35 + factors.length * 15);

      const prediction: Prediction = {
        type: 'delay',
        entity_type: 'task',
        entity_id: taskId,
        entity_name: task.title,
        prediction_value: this.clamp(delayProbability, 0, 100),
        confidence,
        factors,
        recommendation: delayProbability > 50 
          ? 'Considere realocar recursos ou ajustar prazo' 
          : 'Monitorar progresso normalmente',
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (error) {
      console.error('Erro ao prever atraso:', error);
      return null;
    }
  }

  /**
   * Gera previsão de receita
   */
  async predictRevenue(period: 'month' | 'quarter'): Promise<Prediction | null> {
    try {
      // Receita baseada em invoices pagas (se existir); fallback em MRR (contratos ativos)
      const now = new Date();
      const since = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

      const monthlyTotals: Record<string, number> = {};
      let usedInvoices = false;
      try {
        const { data: paid } = await this.db()
          .from('invoices')
          .select('amount, paid_at')
          .not('paid_at', 'is', null)
          .gte('paid_at', since.toISOString())
          .limit(5000);
        for (const row of (paid || []) as any[]) {
          const paidAt = row?.paid_at ? new Date(String(row.paid_at)) : null;
          if (!paidAt || Number.isNaN(paidAt.getTime())) continue;
          const k = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
          monthlyTotals[k] = (monthlyTotals[k] || 0) + Number(row?.amount || 0);
        }
        usedInvoices = Object.keys(monthlyTotals).length > 0;
      } catch (e: any) {
        if (!this.isMissingTableError(e?.message || '')) throw e;
      }

      const keys = Object.keys(monthlyTotals).sort().reverse();
      const last3 = keys.slice(0, 3).map((k) => monthlyTotals[k] || 0);

      let avgRevenue = 0;
      let trend = 0;
      if (usedInvoices && last3.length >= 2 && last3.some((v) => v > 0)) {
        avgRevenue = last3.reduce((a, b) => a + b, 0) / last3.length;
        trend = this.calculateTrend(last3);
      } else {
        // fallback: MRR por contratos (somatório)
        try {
          const { data: contracts } = await this.db()
            .from('contracts')
            .select('value, status')
            .eq('status', 'active')
            .limit(5000);
          const mrr = (contracts || []).reduce((acc: number, c: any) => acc + Number(c?.value || 0), 0);
          if (!mrr) return null;
          avgRevenue = mrr;
          trend = 0;
        } catch (e: any) {
          if (this.isMissingTableError(e?.message || '')) return null;
          throw e;
        }
      }

      // Ajuste sazonal (simplificado)
      const currentMonth = new Date().getMonth();
      const seasonalFactors = [0.9, 0.85, 0.95, 1.0, 1.05, 1.0, 0.95, 0.9, 1.0, 1.1, 1.2, 1.15];
      const seasonalAdjustment = seasonalFactors[currentMonth];

      const predictedRevenue = avgRevenue * (1 + trend) * seasonalAdjustment;

      const factors: PredictionFactor[] = [
        {
          name: 'Média histórica',
          weight: 0.40,
          value: avgRevenue,
          impact: 'neutral',
          description: `Média dos últimos 3 meses: R$ ${avgRevenue.toLocaleString('pt-BR')}`
        },
        {
          name: 'Tendência',
          weight: 0.35,
          value: trend * 100,
          impact: trend > 0 ? 'positive' : 'negative',
          description: `Tendência de ${(trend * 100).toFixed(1)}%`
        },
        {
          name: 'Sazonalidade',
          weight: 0.25,
          value: (seasonalAdjustment - 1) * 100,
          impact: seasonalAdjustment > 1 ? 'positive' : 'negative',
          description: `Ajuste sazonal de ${((seasonalAdjustment - 1) * 100).toFixed(0)}%`
        }
      ];

      const prediction: Prediction = {
        type: 'revenue',
        entity_type: 'system',
        entity_id: 'all',
        entity_name: period === 'month' ? 'Próximo Mês' : 'Próximo Trimestre',
        prediction_value: Math.round(predictedRevenue * (period === 'quarter' ? 3 : 1)),
        confidence: Math.min(80, 55 + (usedInvoices ? Math.min(10, keys.length) * 2 : 0)),
        factors,
        recommendation: trend > 0.05 
          ? 'Tendência positiva - considere expandir capacidade'
          : trend < -0.05
          ? 'Tendência negativa - revisar estratégia comercial'
          : 'Receita estável - manter estratégia atual',
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + (period === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString()
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (error) {
      console.error('Erro ao prever receita:', error);
      return null;
    }
  }

  /**
   * Identifica oportunidades de upsell
   */
  async predictUpsellOpportunities(clientId: string): Promise<Prediction | null> {
    try {
      const { data: client } = await this.db().from('clients').select('*').eq('id', clientId).maybeSingle();

      if (!client) return null;

      // best-effort: se client_services existir, usa; senão, segue sem
      let currentServices: string[] = [];
      try {
        const { data: svc } = await this.db()
          .from('client_services')
          .select('service_type')
          .eq('client_id', clientId)
          .limit(200);
        currentServices = (svc || []).map((s: any) => String(s?.service_type || '')).filter(Boolean);
      } catch (e: any) {
        // ignore (schema pode não existir)
        if (!this.isMissingTableError(e?.message || '')) {
          // ignore
        }
      }
      const factors: PredictionFactor[] = [];
      let upsellScore = 30; // Base

      // Serviços complementares
      const serviceComplement: Record<string, string[]> = {
        'social_media': ['trafego_pago', 'design', 'video'],
        'trafego_pago': ['social_media', 'landing_page', 'email_marketing'],
        'design': ['social_media', 'video', 'branding'],
        'video': ['social_media', 'trafego_pago'],
        'site': ['seo', 'trafego_pago', 'manutencao']
      };

      const recommendedServices: string[] = [];
      for (const service of currentServices) {
        const complements = serviceComplement[service] || [];
        for (const complement of complements) {
          if (!currentServices.includes(complement) && !recommendedServices.includes(complement)) {
            recommendedServices.push(complement);
            upsellScore += 10;
          }
        }
      }

      if (recommendedServices.length > 0) {
        factors.push({
          name: 'Serviços complementares',
          weight: 0.40,
          value: recommendedServices.length,
          impact: 'positive',
          description: `${recommendedServices.length} serviços recomendados`
        });
      }

      // Crescimento do cliente
      const metrics = await this.getMetricsTrend(clientId);
      if (metrics.trend === 'growing' && metrics.change > 20) {
        upsellScore += 20;
        factors.push({
          name: 'Cliente em crescimento',
          weight: 0.30,
          value: metrics.change,
          impact: 'positive',
          description: `Crescimento de ${metrics.change}% - momento ideal para expandir`
        });
      }

      // Tempo como cliente
      const monthsAsClient = Math.floor(
        (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      if (monthsAsClient >= 6) {
        upsellScore += 15;
        factors.push({
          name: 'Cliente fidelizado',
          weight: 0.30,
          value: monthsAsClient,
          impact: 'positive',
          description: `${monthsAsClient} meses de relacionamento`
        });
      }

      const prediction: Prediction = {
        type: 'upsell',
        entity_type: 'client',
        entity_id: clientId,
        entity_name: client.company_name,
        prediction_value: Math.min(100, upsellScore),
        confidence: Math.min(85, 40 + factors.length * 15),
        factors,
        recommendation: recommendedServices.length > 0
          ? `Serviços recomendados: ${recommendedServices.join(', ')}`
          : 'Cliente já possui pacote completo',
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (error) {
      console.error('Erro ao prever upsell:', error);
      return null;
    }
  }

  /**
   * Predição de risco de pagamento (cliente)
   */
  async predictPaymentRisk(clientId: string): Promise<Prediction | null> {
    try {
      const factors: PredictionFactor[] = [];
      const now = new Date();
      const since = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      let overdueCount = 0;
      let maxDaysLate = 0;
      let latePaidCount = 0;
      let openCount = 0;

      const { data: client } = await this.db().from('clients').select('id, company_name').eq('id', clientId).maybeSingle();

      try {
        const { data: invoices } = await this.db()
          .from('invoices')
          .select('due_date, paid_at, status, amount')
          .eq('client_id', clientId)
          .gte('due_date', since.toISOString())
          .limit(5000);

        for (const inv of (invoices || []) as any[]) {
          const due = inv?.due_date ? new Date(String(inv.due_date)) : null;
          if (!due || Number.isNaN(due.getTime())) continue;
          const paidAt = inv?.paid_at ? new Date(String(inv.paid_at)) : null;
          const isPaid = !!paidAt && !Number.isNaN(paidAt.getTime());
          const status = String(inv?.status || '').toLowerCase();

          const isOpen = !isPaid && status !== 'paid';
          if (isOpen) openCount += 1;

          if (isPaid && paidAt!.getTime() > due.getTime()) {
            latePaidCount += 1;
          }
          if (isOpen && due.getTime() < now.getTime()) {
            overdueCount += 1;
            const d = this.daysBetween(now, due);
            maxDaysLate = Math.max(maxDaysLate, d);
          }
        }
      } catch (e: any) {
        if (this.isMissingTableError(e?.message || '')) return null;
        throw e;
      }

      let risk = 10;
      if (openCount > 0) risk += 10;
      if (overdueCount > 0) risk += overdueCount * 20;
      if (latePaidCount > 0) risk += latePaidCount * 10;
      if (maxDaysLate > 0) risk += Math.min(30, maxDaysLate * 1.2);
      risk = this.clamp(risk, 0, 100);

      factors.push({
        name: 'Faturas em aberto',
        weight: 0.25,
        value: openCount,
        impact: openCount > 0 ? 'negative' : 'neutral',
        description: `${openCount} fatura(s) em aberto`,
      });
      factors.push({
        name: 'Faturas vencidas',
        weight: 0.35,
        value: overdueCount,
        impact: overdueCount > 0 ? 'negative' : 'neutral',
        description: `${overdueCount} fatura(s) vencida(s)`,
      });
      factors.push({
        name: 'Dias em atraso (máx)',
        weight: 0.25,
        value: maxDaysLate,
        impact: maxDaysLate > 0 ? 'negative' : 'neutral',
        description: maxDaysLate > 0 ? `${maxDaysLate} dias` : 'Sem atraso',
      });
      factors.push({
        name: 'Pagamentos pagos em atraso',
        weight: 0.15,
        value: latePaidCount,
        impact: latePaidCount > 0 ? 'negative' : 'neutral',
        description: `${latePaidCount} pagamento(s) atrasado(s) nos últimos 6 meses`,
      });

      const recommendation =
        risk >= 70
          ? '🚨 Alto risco: acionar cobrança via Intranet/Email/WhatsApp e renegociar'
          : risk >= 45
            ? '⚠️ Médio risco: lembrar vencimento e acompanhar'
            : '✅ Baixo risco: manter acompanhamento normal';

      const prediction: Prediction = {
        type: 'payment_risk',
        entity_type: 'client',
        entity_id: clientId,
        entity_name: client?.company_name || undefined,
        prediction_value: risk,
        confidence: Math.min(90, 55 + factors.length * 8),
        factors,
        recommendation,
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (e) {
      console.error('Erro ao prever risco de pagamento:', e);
      return null;
    }
  }

  /**
   * Predição de LTV (cliente) — estimativa simples: MRR * lifetime estimado (com base em churn)
   */
  async predictLtv(clientId: string): Promise<Prediction | null> {
    try {
      const factors: PredictionFactor[] = [];

      const { data: client } = await this.db().from('clients').select('id, company_name').eq('id', clientId).maybeSingle();

      let mrr = 0;
      try {
        const { data: contracts } = await this.db()
          .from('contracts')
          .select('value, status')
          .eq('client_id', clientId)
          .eq('status', 'active')
          .limit(2000);
        mrr = (contracts || []).reduce((acc: number, c: any) => acc + Number(c?.value || 0), 0);
      } catch (e: any) {
        if (!this.isMissingTableError(e?.message || '')) throw e;
      }

      let churnProb = 30;
      try {
        const { data: hs } = await this.db()
          .from('client_health_scores')
          .select('churn_probability')
          .eq('client_id', clientId)
          .maybeSingle();
        if (hs?.churn_probability != null) churnProb = this.clamp(Number(hs.churn_probability), 0, 100);
      } catch {
        // ignore
      }

      const churnRate = Math.max(0.02, Math.min(0.5, churnProb / 100));
      const lifetimeMonths = Math.min(36, Math.max(3, Math.round(1 / churnRate)));
      const ltv = Math.max(0, Math.round(mrr * lifetimeMonths));

      factors.push({
        name: 'MRR (contratos ativos)',
        weight: 0.45,
        value: mrr,
        impact: mrr > 0 ? 'positive' : 'neutral',
        description: `MRR estimado: R$ ${mrr.toLocaleString('pt-BR')}`,
      });
      factors.push({
        name: 'Churn (health score)',
        weight: 0.35,
        value: churnProb,
        impact: churnProb >= 60 ? 'negative' : 'neutral',
        description: `Churn estimado: ${Math.round(churnProb)}%`,
      });
      factors.push({
        name: 'Lifetime estimado (meses)',
        weight: 0.20,
        value: lifetimeMonths,
        impact: lifetimeMonths >= 12 ? 'positive' : 'neutral',
        description: `Lifetime estimado: ${lifetimeMonths} meses`,
      });

      const prediction: Prediction = {
        type: 'ltv',
        entity_type: 'client',
        entity_id: clientId,
        entity_name: client?.company_name || undefined,
        prediction_value: ltv,
        confidence: Math.min(85, 50 + factors.length * 10),
        factors,
        recommendation:
          churnProb >= 60
            ? 'Priorizar retenção para proteger LTV'
            : 'Cliente saudável: explorar upsell/cross-sell',
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (e) {
      console.error('Erro ao prever LTV:', e);
      return null;
    }
  }

  /**
   * Forecast de demanda/capacidade (sistema): usa volume de tarefas e capacidade (contagem de colaboradores ativos)
   */
  async predictDemandCapacity(period: 'month' | 'quarter' = 'month'): Promise<Prediction | null> {
    try {
      const now = new Date();
      const lookbackDays = period === 'quarter' ? 180 : 90;
      const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

      let tasksCount = 0;
      let tasksPerWeek = 0;
      try {
        const { data: tasks } = await this.db()
          .from('kanban_tasks')
          .select('created_at')
          .gte('created_at', since.toISOString())
          .limit(5000);
        tasksCount = (tasks || []).length;
        tasksPerWeek = Math.round(tasksCount / Math.max(1, lookbackDays / 7));
      } catch (e: any) {
        if (this.isMissingTableError(e?.message || '')) return null;
      }

      let activeEmployees = 0;
      try {
        const { data: emps } = await this.db().from('employees').select('id, is_active').limit(5000);
        activeEmployees = (emps || []).filter((e: any) => e?.is_active !== false).length;
      } catch {
        activeEmployees = 0;
      }

      const capacityPerWeek = activeEmployees > 0 ? activeEmployees * 20 : 0;
      const utilization = capacityPerWeek > 0 ? (tasksPerWeek / capacityPerWeek) * 100 : 0;
      const score = this.clamp(utilization, 0, 100);

      const factors: PredictionFactor[] = [
        {
          name: 'Tarefas por semana',
          weight: 0.45,
          value: tasksPerWeek,
          impact: 'neutral',
          description: `Média: ${tasksPerWeek}/semana (últimos ${lookbackDays} dias)`,
        },
        {
          name: 'Colaboradores ativos',
          weight: 0.25,
          value: activeEmployees,
          impact: activeEmployees > 0 ? 'positive' : 'neutral',
          description: `${activeEmployees} colaboradores ativos`,
        },
        {
          name: 'Capacidade estimada',
          weight: 0.30,
          value: capacityPerWeek,
          impact: capacityPerWeek > 0 ? 'positive' : 'neutral',
          description: `Capacidade: ${capacityPerWeek}/semana (heurística)`,
        },
      ];

      const recommendation =
        score >= 85
          ? '🚨 Capacidade crítica: redistribuir demandas e revisar prioridades'
          : score >= 65
            ? '⚠️ Capacidade pressionada: planejar reforço/automação'
            : '✅ Capacidade saudável';

      const prediction: Prediction = {
        type: 'demand_capacity',
        entity_type: 'system',
        entity_id: 'all',
        entity_name: period === 'month' ? 'Demanda/Capacidade (30d)' : 'Demanda/Capacidade (trimestre)',
        prediction_value: score,
        confidence: Math.min(80, 45 + factors.length * 10),
        factors,
        recommendation,
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + (period === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (e) {
      console.error('Erro ao prever demanda/capacidade:', e);
      return null;
    }
  }

  /**
   * Predição de risco de estouro de orçamento (campanha)
   * - Usa campaign_budgets + campaigns (se existirem).
   * - prediction_value = risco % (0..100), onde 100 = estourado/sem orçamento restante.
   */
  async predictBudgetOverrun(campaignId: string): Promise<Prediction | null> {
    try {
      const factors: PredictionFactor[] = [];

      const { data: campaign } = await this.db()
        .from('campaigns')
        .select('id, name, client_id, status, start_date, end_date')
        .eq('id', campaignId)
        .maybeSingle();
      if (!campaign) return null;

      const { data: budgets } = await this.db()
        .from('campaign_budgets')
        .select('budget_type, budget_amount, spent_amount, remaining_amount, period_start, period_end, updated_at')
        .eq('campaign_id', campaignId)
        .limit(50);

      const rows = (budgets || []) as any[];
      if (!rows.length) return null;

      // Escolhe o budget "mais relevante": total > monthly > daily
      const rank = (t: string) => (t === 'total' ? 3 : t === 'monthly' ? 2 : 1);
      const chosen = rows.slice().sort((a, b) => rank(String(b?.budget_type || '')) - rank(String(a?.budget_type || '')))[0];

      const budgetAmount = Number(chosen?.budget_amount || 0);
      const spentAmount = Number(chosen?.spent_amount || 0);
      const remaining = chosen?.remaining_amount != null ? Number(chosen.remaining_amount) : budgetAmount - spentAmount;

      if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) return null;

      const spentPct = (spentAmount / budgetAmount) * 100;
      const remainingPct = (remaining / budgetAmount) * 100;

      // risco cresce quando remaining cai e quando spentPct > 100
      let risk = 0;
      if (spentPct >= 100) risk = 95 + Math.min(5, (spentPct - 100) / 10);
      else risk = this.clamp(100 - remainingPct, 0, 95);

      // Ajuste por tempo de campanha (se datas existirem)
      try {
        const start = campaign?.start_date ? new Date(String(campaign.start_date)) : null;
        const end = campaign?.end_date ? new Date(String(campaign.end_date)) : null;
        if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          const totalDays = Math.max(1, this.daysBetween(end, start));
          const elapsedDays = Math.max(0, Math.min(totalDays, this.daysBetween(new Date(), start)));
          const timePct = (elapsedDays / totalDays) * 100;
          // se gasto está mais rápido que o tempo, aumenta risco
          if (spentPct > timePct + 10) risk = this.clamp(risk + 10, 0, 100);
          factors.push({
            name: 'Ritmo vs tempo',
            weight: 0.20,
            value: Math.round(spentPct - timePct),
            impact: spentPct > timePct + 10 ? 'negative' : 'neutral',
            description: `Gasto ${spentPct.toFixed(0)}% vs tempo ${timePct.toFixed(0)}%`,
          });
        }
      } catch {
        // ignore
      }

      factors.push({
        name: 'Orçamento',
        weight: 0.35,
        value: budgetAmount,
        impact: 'neutral',
        description: `Budget ${String(chosen?.budget_type || '').toUpperCase()}: R$ ${budgetAmount.toLocaleString('pt-BR')}`,
      });
      factors.push({
        name: 'Gasto',
        weight: 0.35,
        value: spentAmount,
        impact: spentPct >= 80 ? 'negative' : 'neutral',
        description: `Gasto: R$ ${spentAmount.toLocaleString('pt-BR')} (${spentPct.toFixed(0)}%)`,
      });
      factors.push({
        name: 'Restante',
        weight: 0.10,
        value: remaining,
        impact: remainingPct <= 20 ? 'negative' : 'neutral',
        description: `Restante: R$ ${remaining.toLocaleString('pt-BR')} (${remainingPct.toFixed(0)}%)`,
      });

      const recommendation =
        risk >= 85
          ? '🚨 Risco crítico: pausar/ajustar campanha e revisar budget com o cliente'
          : risk >= 60
            ? '⚠️ Risco médio: otimizar criativos/segmentação e acompanhar daily'
            : '✅ Orçamento sob controle';

      const prediction: Prediction = {
        type: 'budget_overrun',
        entity_type: 'campaign',
        entity_id: campaignId,
        entity_name: campaign?.name || undefined,
        prediction_value: this.clamp(risk, 0, 100),
        confidence: Math.min(85, 50 + Math.min(5, factors.length) * 8),
        factors,
        recommendation,
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (e: any) {
      if (this.isMissingTableError(e?.message || '')) return null;
      console.error('Erro ao prever estouro de orçamento:', e);
      return null;
    }
  }

  /**
   * Predição de risco de estouro de orçamento (tarefa/projeto)
   *
   * Fonte principal: `kanban_tasks.reference_links.stage_forms` (valores preenchidos no PhaseTransitionModal)
   * Campos comuns: `budget`, `total_budget`.
   */
  async predictTaskBudgetOverrun(taskId: string): Promise<Prediction | null> {
    try {
      const { data: task } = await this.db()
        .from('kanban_tasks')
        .select('id, title, priority, estimated_hours, due_date, created_at, updated_at, status, reference_links')
        .eq('id', taskId)
        .maybeSingle();
      if (!task) return null;

      const ref = ((task as any)?.reference_links || {}) as any;
      const stageForms = (ref?.stage_forms || {}) as Record<string, any>;

      const budgetKeys = ['total_budget', 'budget', 'marketing_budget', 'daily_budget', 'lifetime_budget'];
      const budgets: number[] = [];

      const scanBudget = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of budgetKeys) {
          const v = Number((obj as any)?.[k]);
          if (Number.isFinite(v) && v > 0) budgets.push(v);
        }
      };

      for (const k of Object.keys(stageForms)) scanBudget(stageForms[k]);
      scanBudget(ref);

      const plannedBudget = budgets.length ? Math.max(...budgets) : null;
      const estHours = Number((task as any)?.estimated_hours || 0);

      // Se não há qualquer sinal de budget/complexidade, não gera.
      if (!plannedBudget && !estHours) return null;

      let risk = 15;
      const factors: PredictionFactor[] = [];

      if (plannedBudget != null) {
        factors.push({
          name: 'Orçamento planejado',
          weight: 0.35,
          value: plannedBudget,
          impact: 'neutral',
          description: `Orçamento: R$ ${plannedBudget.toLocaleString('pt-BR')}`,
        });

        // Heurística: budgets muito baixos são mais sensíveis a escopo
        if (plannedBudget < 1000) risk += 20;
        else if (plannedBudget < 5000) risk += 12;
        else if (plannedBudget < 15000) risk += 6;
        else risk += 3;
      }

      if (estHours) {
        risk += Math.min(40, estHours * 3);
        factors.push({
          name: 'Esforço estimado',
          weight: 0.30,
          value: estHours,
          impact: estHours >= 12 ? 'negative' : 'neutral',
          description: `Estimativa: ${estHours}h`,
        });
      }

      const pr = String((task as any)?.priority || '').toLowerCase();
      const highPriority = pr.includes('urgent') || pr.includes('urgente') || pr.includes('alta') || pr.includes('high');
      if (highPriority) {
        risk += 10;
        factors.push({
          name: 'Prioridade alta',
          weight: 0.10,
          value: 1,
          impact: 'negative',
          description: 'Tarefa urgente/alta tende a sofrer scope creep e retrabalho',
        });
      }

      if ((task as any)?.due_date) {
        const due = new Date(String((task as any).due_date));
        const daysUntilDue = Math.floor((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (!Number.isNaN(due.getTime())) {
          if (daysUntilDue < 0) risk += 30;
          else if (daysUntilDue <= 2) risk += 15;
          else if (daysUntilDue <= 7) risk += 8;

          factors.push({
            name: 'Proximidade do prazo',
            weight: 0.15,
            value: daysUntilDue,
            impact: daysUntilDue <= 2 ? 'negative' : 'neutral',
            description: daysUntilDue < 0 ? `Atraso: ${Math.abs(daysUntilDue)} dias` : `${daysUntilDue} dias até o prazo`,
          });
        }
      }

      // Idade da tarefa (quanto mais longa, maior chance de escopo/overrun)
      const createdAt = (task as any)?.created_at ? new Date(String((task as any).created_at)) : null;
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const ageDays = this.daysBetween(new Date(), createdAt);
        if (ageDays > 21) risk += 12;
        else if (ageDays > 14) risk += 8;
        else if (ageDays > 7) risk += 4;
        factors.push({
          name: 'Idade da tarefa',
          weight: 0.10,
          value: ageDays,
          impact: ageDays > 14 ? 'negative' : 'neutral',
          description: `${ageDays} dias desde criação`,
        });
      }

      // Tight budget vs high effort
      if (plannedBudget != null && estHours) {
        const budgetPerHour = plannedBudget / Math.max(1, estHours);
        if (budgetPerHour < 120) risk += 18;
        else if (budgetPerHour < 200) risk += 10;
        factors.push({
          name: 'Orçamento por hora (heurística)',
          weight: 0.20,
          value: Math.round(budgetPerHour),
          impact: budgetPerHour < 120 ? 'negative' : budgetPerHour < 200 ? 'neutral' : 'positive',
          description: `≈ R$ ${Math.round(budgetPerHour)}/h`,
        });
      }

      risk = this.clamp(risk, 0, 100);

      const recommendation =
        risk >= 75
          ? '🚨 Alto risco: revisar escopo, aprovações e limites de budget (criar checkpoints)'
          : risk >= 55
            ? '⚠️ Médio risco: acompanhar burn semanal e evitar retrabalho'
            : '✅ Baixo risco: manter controle normal';

      const prediction: Prediction = {
        type: 'budget_overrun',
        entity_type: 'task',
        entity_id: taskId,
        entity_name: (task as any)?.title || undefined,
        prediction_value: risk,
        confidence: Math.min(85, 45 + factors.length * 8),
        factors,
        recommendation,
        created_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await this.savePrediction(prediction);
      return prediction;
    } catch (e) {
      console.error('Erro ao prever estouro de orçamento:', e);
      return null;
    }
  }

  // Métodos auxiliares
  private async getEngagementMetrics(clientId: string) {
    // Preferência: social_account_metrics_daily (jsonb.metrics)
    try {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data, error } = await this.db()
        .from('social_account_metrics_daily')
        .select('metrics, metric_date')
        .eq('client_id', clientId)
        .gte('metric_date', since)
        .limit(5000);
      if (error) throw error;

      let reach = 0;
      let engagement = 0;
      for (const row of (data || []) as any[]) {
        const m = row?.metrics && typeof row.metrics === 'object' ? row.metrics : {};
        reach += Number(m.reach ?? m.total_reach ?? 0);
        engagement += Number(m.engagement ?? m.total_engagement ?? 0);
      }
      if (reach <= 0) return { score: 60 };
      const rate = (engagement / reach) * 100;
      const score = this.clamp(rate * 2, 0, 100);
      return { score: Number.isFinite(score) ? score : 60 };
    } catch (e: any) {
      if (this.isMissingTableError(e?.message || '')) {
        // Fallback: social_metrics (colunas diretas)
        try {
          const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          const { data } = await this.db()
            .from('social_metrics')
            .select('engagement_rate, metric_date')
            .eq('client_id', clientId)
            .gte('metric_date', since)
            .order('metric_date', { ascending: false })
            .limit(30);
          const rates = (data || []).map((r: any) => Number(r?.engagement_rate || 0)).filter((n) => Number.isFinite(n));
          if (rates.length === 0) return { score: 60 };
          const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
          return { score: this.clamp(avg * 2, 0, 100) };
        } catch {
          return { score: 60 };
        }
      }
      return { score: 60 };
    }
  }

  private async getPaymentHistory(clientId: string) {
    const now = new Date();
    const since = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    try {
      const { data, error } = await this.db()
        .from('invoices')
        .select('due_date, paid_at, status')
        .eq('client_id', clientId)
        .gte('due_date', since.toISOString())
        .limit(5000);
      if (error) throw error;

      let late = 0;
      for (const inv of (data || []) as any[]) {
        const due = inv?.due_date ? new Date(String(inv.due_date)) : null;
        if (!due || Number.isNaN(due.getTime())) continue;
        const paidAt = inv?.paid_at ? new Date(String(inv.paid_at)) : null;
        const isPaid = !!paidAt && !Number.isNaN(paidAt.getTime());
        const status = String(inv?.status || '').toLowerCase();
        const isOpen = !isPaid && status !== 'paid';
        if (isPaid && paidAt!.getTime() > due.getTime()) late += 1;
        if (isOpen && due.getTime() < now.getTime()) late += 1;
      }
      return { late_payments: late };
    } catch (e: any) {
      if (this.isMissingTableError(e?.message || '')) return { late_payments: 0 };
      return { late_payments: 0 };
    }
  }

  private async getLastContactDate(clientId: string) {
    try {
      const { data } = await this.db()
        .from('event_log')
        .select('created_at')
        .eq('entity_type', 'client')
        .eq('entity_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1);
      const iso = (data || [])[0]?.created_at;
      if (iso) {
        const d = new Date(String(iso));
        if (!Number.isNaN(d.getTime())) return d;
      }
    } catch (e: any) {
      // ignore
    }

    try {
      const { data } = await this.db().from('clients').select('updated_at, created_at').eq('id', clientId).maybeSingle();
      const iso = data?.updated_at || data?.created_at || null;
      if (iso) {
        const d = new Date(String(iso));
        if (!Number.isNaN(d.getTime())) return d;
      }
    } catch {
      // ignore
    }

    return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  }

  private async getSatisfactionScore(clientId: string) {
    try {
      const { data } = await this.db()
        .from('nps_feedback')
        .select('score, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(3);
      const scores = (data || []).map((r: any) => Number(r?.score)).filter((n) => Number.isFinite(n));
      if (scores.length === 0) return 8;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return Math.max(0, Math.min(10, avg));
    } catch (e: any) {
      if (this.isMissingTableError(e?.message || '')) return 8;
      return 8;
    }
  }

  private async getMetricsTrend(clientId: string) {
    try {
      const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data, error } = await this.db()
        .from('social_account_metrics_daily')
        .select('metrics, metric_date')
        .eq('client_id', clientId)
        .gte('metric_date', since)
        .order('metric_date', { ascending: false })
        .limit(60);
      if (error) throw error;

      const rows = (data || []) as any[];
      if (rows.length < 6) return { trend: 'stable', change: 0 };

      const rates = rows
        .map((r) => {
          const m = r?.metrics && typeof r.metrics === 'object' ? r.metrics : {};
          const reach = Number(m.reach ?? m.total_reach ?? 0);
          const engagement = Number(m.engagement ?? m.total_engagement ?? 0);
          const rate = reach > 0 ? (engagement / reach) * 100 : 0;
          return Number.isFinite(rate) ? rate : 0;
        })
        .filter((n) => Number.isFinite(n));

      const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
      const recent = avg(rates.slice(0, 7));
      const older = avg(rates.slice(7, 14));
      const change = older > 0 ? ((recent - older) / older) * 100 : 0;
      const trend = change >= 5 ? 'growing' : change <= -5 ? 'declining' : 'stable';
      return { trend, change: Math.round(change) };
    } catch (e: any) {
      if (this.isMissingTableError(e?.message || '')) return { trend: 'stable', change: 0 };
      return { trend: 'stable', change: 0 };
    }
  }

  private async getLeadInteractions(leadId: string) {
    try {
      const { data } = await this.db()
        .from('prospecting_leads')
        .select('status, last_interaction_at, source_details')
        .eq('id', leadId)
        .maybeSingle();
      if (!data) return { total: 1 };
      const status = String((data as any).status || '').toLowerCase();
      const base = status === 'qualified' ? 4 : status === 'contacted' ? 3 : status === 'new' ? 1 : 2;
      const last = (data as any).last_interaction_at ? new Date(String((data as any).last_interaction_at)) : null;
      const recentBoost = last && !Number.isNaN(last.getTime()) && this.daysBetween(new Date(), last) <= 7 ? 1 : 0;
      const sd = (data as any).source_details;
      const extra = sd && typeof sd === 'object' && Array.isArray((sd as any).interactions) ? (sd as any).interactions.length : 0;
      return { total: Math.max(1, base + recentBoost + extra) };
    } catch (e: any) {
      if (this.isMissingTableError(e?.message || '')) return { total: 1 };
      return { total: 1 };
    }
  }

  private async getEmployeeDeliveryHistory(employeeId: string) {
    try {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await this.db()
        .from('kanban_tasks')
        .select('due_date, updated_at, status')
        .eq('assigned_to', employeeId)
        .gte('updated_at', since)
        .limit(5000);

      const done = (data || []).filter((t: any) => String(t?.status || '').toLowerCase() === 'done');
      const withDue = done.filter((t: any) => !!t?.due_date);
      if (withDue.length === 0) return { late_rate: 0 };
      const late = withDue.filter((t: any) => {
        const due = new Date(String(t.due_date));
        const upd = new Date(String(t.updated_at));
        if (Number.isNaN(due.getTime()) || Number.isNaN(upd.getTime())) return false;
        return upd.getTime() > due.getTime();
      }).length;
      const rate = (late / withDue.length) * 100;
      return { late_rate: Math.round(rate) };
    } catch (e: any) {
      if (this.isMissingTableError(e?.message || '')) return { late_rate: 0 };
      return { late_rate: 0 };
    }
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const older = values.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, values.length - 3);
    return older > 0 ? (recent - older) / older : 0;
  }

  private generateChurnRecommendation(score: number, factors: PredictionFactor[]): string {
    if (score >= 70) {
      return '🚨 URGENTE: Agendar reunião de retenção imediatamente';
    } else if (score >= 50) {
      return '⚠️ Atenção: Iniciar ações preventivas de retenção';
    } else if (score >= 30) {
      return '📊 Monitorar: Acompanhar métricas semanalmente';
    }
    return '✅ Saudável: Manter relacionamento normal';
  }

  private generateConversionRecommendation(score: number, lead: any): string {
    if (score >= 70) {
      return '🎯 Alta probabilidade: Enviar proposta personalizada';
    } else if (score >= 50) {
      return '📞 Boa chance: Agendar call de apresentação';
    } else if (score >= 30) {
      return '📧 Nutrir: Continuar envio de conteúdo relevante';
    }
    return '❄️ Frio: Manter em nurturing automático';
  }

  private toDateOnly(iso: string): string | null {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }

  private async savePrediction(prediction: Prediction): Promise<string | null> {
    try {
      const predictedForDate = this.toDateOnly(prediction.valid_until);
      const looksLikeUuid = (v: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      const targetId = prediction.entity_id && looksLikeUuid(prediction.entity_id) ? prediction.entity_id : null;
      const { data, error } = await this.db()
        .from('ml_predictions_log')
        .insert({
          prediction_type: prediction.type,
          prediction_target: prediction.entity_type,
          target_id: targetId,
          predicted_value: {
            value: prediction.prediction_value,
            factors: prediction.factors || [],
            recommendation: prediction.recommendation || null,
            entity_name: prediction.entity_name || null,
            entity_id: prediction.entity_id || null,
          },
          predicted_probability: prediction.confidence,
          predicted_at: prediction.created_at,
          predicted_for_date: predictedForDate,
          model_version: 'heuristic_v1',
          features_used: (prediction.factors || []).map((f) => f.name),
          created_by: null,
        })
        .select('id')
        .single();
      if (error) throw error;
      if (data?.id) prediction.id = data.id;
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao salvar previsão:', error);
      return null;
    }
  }

  /**
   * Busca previsões
   */
  async getPredictions(filters?: {
    type?: Prediction['type'];
    entity_type?: string;
    entity_id?: string;
    min_confidence?: number;
  }): Promise<Prediction[]> {
    try {
      let query = this.db()
        .from('ml_predictions_log')
        .select('*')
        .order('predicted_at', { ascending: false });

      if (filters?.type) query = query.eq('prediction_type', filters.type);
      if (filters?.entity_type) query = query.eq('prediction_target', filters.entity_type);
      if (filters?.entity_id) query = query.eq('target_id', filters.entity_id);
      if (filters?.min_confidence) query = query.gte('predicted_probability', filters.min_confidence);

      const { data } = await query;
      const rows = (data || []) as any[];
      return rows.map((r) => {
        const pv = r.predicted_value;
        const value = typeof pv === 'object' && pv !== null && 'value' in pv ? Number((pv as any).value) : Number(pv);
        const factors = (pv && typeof pv === 'object' ? (pv as any).factors : null) || [];
        const recommendation = pv && typeof pv === 'object' ? (pv as any).recommendation : undefined;
        const entityName = pv && typeof pv === 'object' ? (pv as any).entity_name : undefined;

        const createdAt = r.predicted_at || r.created_at || new Date().toISOString();
        const validUntil = r.predicted_for_date ? new Date(String(r.predicted_for_date)).toISOString() : createdAt;

        return {
          id: r.id,
          type: r.prediction_type,
          entity_type: r.prediction_target,
          entity_id: r.target_id,
          entity_name: entityName,
          prediction_value: Number.isFinite(value) ? value : 0,
          confidence: Number(r.predicted_probability || 0),
          factors,
          recommendation,
          created_at: createdAt,
          valid_until: validUntil,
          was_correct: r.was_correct ?? undefined,
          actual_outcome: r.actual_value ?? undefined,
        } as Prediction;
      });
    } catch (error) {
      console.error('Erro ao buscar previsões:', error);
      return [];
    }
  }

  /**
   * Registra feedback sobre previsão
   */
  async recordPredictionOutcome(predictionId: string, wasCorrect: boolean, actualOutcome?: any): Promise<void> {
    try {
      const nowIso = new Date().toISOString();
      await this.db()
        .from('ml_predictions_log')
        .update({
          was_correct: wasCorrect,
          actual_value: actualOutcome ?? null,
          actual_recorded_at: nowIso,
          accuracy_score: wasCorrect ? 100 : 0,
        })
        .eq('id', predictionId);
    } catch (error) {
      console.error('Erro ao registrar outcome:', error);
    }
  }
}

export const predictiveEngine = new PredictiveEngineService();
export default predictiveEngine;




