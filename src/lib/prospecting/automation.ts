/**
 * Valle 360 - Automação de Prospecção Comercial
 * Captação de leads → Qualificação IA → Contato → Reunião
 */

import { supabase } from '@/lib/supabase';
import { tavilyClient } from '@/lib/integrations/tavily/client';

// =====================================================
// TIPOS
// =====================================================

export interface ProspectingLead {
  id: string;
  company_name: string;
  company_website?: string;
  company_industry?: string;
  company_size?: 'micro' | 'small' | 'medium' | 'large';
  company_location?: { city?: string; state?: string; country?: string };
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  contact_role?: string;
  source: 'tavily' | 'linkedin' | 'google_maps' | 'manual' | 'referral';
  source_details?: Record<string, any>;
  segment: string;
  qualification_score: number;
  qualification_factors: { factor: string; impact: number }[];
  status: 'new' | 'contacted' | 'responding' | 'meeting_scheduled' | 'negotiating' | 'won' | 'lost';
  assigned_to?: string;
  estimated_value?: number;
  interactions_count: number;
  next_action?: string;
  next_action_date?: string;
  tags: string[];
  notes?: string;
  created_at: string;
}

export interface ProspectingCampaign {
  id: string;
  name: string;
  target_segment: string;
  target_criteria: Record<string, any>;
  sequence: CampaignSequenceStep[];
  max_leads_per_day: number;
  auto_qualify: boolean;
  min_qualification_score: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  leads_found: number;
  leads_contacted: number;
  meetings_scheduled: number;
  deals_won: number;
}

export interface CampaignSequenceStep {
  day: number;
  channel: 'email' | 'linkedin' | 'whatsapp' | 'call';
  template: string;
  condition?: string; // 'no_response', 'opened', etc
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  type: string;
  channel: string;
  content?: string;
  status: string;
  detected_intent?: string;
  intent_confidence?: number;
  action_generated?: string;
  sent_at: string;
}

export interface QualificationResult {
  score: number;
  factors: { factor: string; impact: number; description: string }[];
  recommendation: 'high_priority' | 'medium_priority' | 'low_priority' | 'discard';
  reasoning: string;
}

// =====================================================
// SERVIÇO DE PROSPECÇÃO
// =====================================================

class ProspectingAutomation {

  /**
   * Busca leads automaticamente por segmento
   */
  async findLeads(
    segment: string,
    criteria: Record<string, any>,
    limit: number = 10
  ): Promise<ProspectingLead[]> {
    const leads: ProspectingLead[] = [];

    try {
      // Construir query de busca
      const searchQuery = this.buildSearchQuery(segment, criteria);
      
      // Buscar via Tavily
      const searchResults = await tavilyClient.search({
        query: searchQuery,
        searchDepth: 'advanced',
        maxResults: limit * 2 // Buscar mais para filtrar
      });

      // Processar resultados
      for (const result of searchResults.results) {
        const lead = await this.processSearchResult(result, segment);
        if (lead) {
          // Qualificar lead
          const qualification = await this.qualifyLead(lead);
          lead.qualification_score = qualification.score;
          lead.qualification_factors = qualification.factors;
          
          leads.push(lead);
        }

        if (leads.length >= limit) break;
      }

      // Salvar leads no banco
      for (const lead of leads) {
        await this.saveLead(lead);
      }

      return leads;

    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      return [];
    }
  }

  /**
   * Constrói query de busca por segmento
   */
  private buildSearchQuery(segment: string, criteria: Record<string, any>): string {
    const segmentQueries: Record<string, string> = {
      ecommerce: 'lojas online e-commerce Brasil que não fazem tráfego pago',
      restaurante: 'restaurantes bares cafeterias sem marketing digital redes sociais',
      clinica: 'clínicas médicas odontológicas estéticas sem presença digital',
      franquia: 'franquias em expansão buscando franqueados Brasil',
      imobiliaria: 'imobiliárias corretores sem marketing digital',
      educacao: 'escolas cursos academias sem presença online',
      fitness: 'academias crossfit studios pilates sem marketing',
      saude: 'hospitais clínicas laboratórios marketing digital',
      servicos: 'empresas serviços profissionais sem site moderno'
    };

    let query = segmentQueries[segment] || `empresas ${segment} sem marketing digital`;

    // Adicionar filtros de localização
    if (criteria.location?.state) {
      query += ` ${criteria.location.state}`;
    }
    if (criteria.location?.city) {
      query += ` ${criteria.location.city}`;
    }

    return query;
  }

  /**
   * Processa resultado de busca em lead
   */
  private async processSearchResult(
    result: any,
    segment: string
  ): Promise<ProspectingLead | null> {
    try {
      // Extrair informações do resultado
      const url = new URL(result.url);
      const domain = url.hostname.replace('www.', '');
      
      // Tentar extrair nome da empresa do título ou domínio
      let companyName = result.title?.split(' - ')[0] || 
                        result.title?.split(' | ')[0] || 
                        domain.split('.')[0];
      
      // Capitalizar nome
      companyName = companyName
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      const lead: ProspectingLead = {
        id: '', // Será gerado pelo banco
        company_name: companyName,
        company_website: result.url,
        company_industry: segment,
        source: 'tavily',
        source_details: { search_result: result },
        segment,
        qualification_score: 0,
        qualification_factors: [],
        status: 'new',
        interactions_count: 0,
        tags: [segment],
        created_at: new Date().toISOString()
      };

      return lead;

    } catch (error) {
      console.error('Erro ao processar resultado:', error);
      return null;
    }
  }

  /**
   * Qualifica um lead com IA
   */
  async qualifyLead(lead: Partial<ProspectingLead>): Promise<QualificationResult> {
    const factors: { factor: string; impact: number; description: string }[] = [];
    let score = 50; // Score base

    // Fator: Tem website
    if (lead.company_website) {
      score += 10;
      factors.push({
        factor: 'tem_website',
        impact: 10,
        description: 'Empresa possui website'
      });

      // Verificar se site é moderno (simplificado)
      if (lead.company_website.includes('https')) {
        score += 5;
        factors.push({
          factor: 'site_seguro',
          impact: 5,
          description: 'Site com HTTPS'
        });
      }
    } else {
      factors.push({
        factor: 'sem_website',
        impact: 15,
        description: 'Empresa sem website - oportunidade de criação'
      });
      score += 15;
    }

    // Fator: Segmento
    const highValueSegments = ['ecommerce', 'clinica', 'franquia', 'imobiliaria'];
    if (highValueSegments.includes(lead.segment || '')) {
      score += 10;
      factors.push({
        factor: 'segmento_alto_valor',
        impact: 10,
        description: 'Segmento com alto potencial de investimento'
      });
    }

    // Fator: Porte da empresa
    if (lead.company_size === 'medium' || lead.company_size === 'large') {
      score += 15;
      factors.push({
        factor: 'porte_medio_grande',
        impact: 15,
        description: 'Empresa de médio/grande porte'
      });
    }

    // Fator: Tem contato direto
    if (lead.contact_email || lead.contact_phone) {
      score += 10;
      factors.push({
        factor: 'contato_direto',
        impact: 10,
        description: 'Contato direto disponível'
      });
    }

    // Fator: LinkedIn do contato
    if (lead.contact_linkedin) {
      score += 5;
      factors.push({
        factor: 'linkedin_disponivel',
        impact: 5,
        description: 'Perfil LinkedIn identificado'
      });
    }

    // Limitar score a 100
    score = Math.min(100, score);

    // Determinar recomendação
    let recommendation: QualificationResult['recommendation'];
    if (score >= 75) {
      recommendation = 'high_priority';
    } else if (score >= 50) {
      recommendation = 'medium_priority';
    } else if (score >= 30) {
      recommendation = 'low_priority';
    } else {
      recommendation = 'discard';
    }

    return {
      score,
      factors,
      recommendation,
      reasoning: `Lead qualificado com score ${score}/100. ${factors.length} fatores analisados.`
    };
  }

  /**
   * Salva lead no banco
   */
  async saveLead(lead: Partial<ProspectingLead>): Promise<ProspectingLead | null> {
    const { data, error } = await supabase
      .from('prospecting_leads')
      .insert({
        company_name: lead.company_name,
        company_website: lead.company_website,
        company_industry: lead.company_industry,
        company_size: lead.company_size,
        company_location: lead.company_location,
        contact_name: lead.contact_name,
        contact_email: lead.contact_email,
        contact_phone: lead.contact_phone,
        contact_linkedin: lead.contact_linkedin,
        contact_role: lead.contact_role,
        source: lead.source,
        source_details: lead.source_details,
        segment: lead.segment,
        qualification_score: lead.qualification_score,
        qualification_factors: lead.qualification_factors,
        status: 'new',
        tags: lead.tags || []
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar lead:', error);
      return null;
    }

    return data as ProspectingLead;
  }

  /**
   * Inicia sequência de contato para um lead
   */
  async startContactSequence(
    leadId: string,
    campaignId?: string
  ): Promise<{ success: boolean; message: string }> {
    // Buscar lead
    const { data: lead, error } = await supabase
      .from('prospecting_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return { success: false, message: 'Lead não encontrado' };
    }

    // Buscar template de introdução
    const { data: template } = await supabase
      .from('prospecting_templates')
      .select('*')
      .eq('purpose', 'intro')
      .eq('channel', 'email')
      .single();

    if (!template) {
      return { success: false, message: 'Template não encontrado' };
    }

    // Gerar conteúdo personalizado
    const content = this.personalizeTemplate(template.content, lead);
    const subject = this.personalizeTemplate(template.subject || '', lead);

    // Registrar interação
    await supabase
      .from('lead_interactions')
      .insert({
        lead_id: leadId,
        type: 'email_sent',
        channel: 'email',
        subject,
        content,
        template_id: template.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    // Atualizar status do lead
    await supabase
      .from('prospecting_leads')
      .update({
        status: 'contacted',
        interactions_count: (lead.interactions_count || 0) + 1,
        last_interaction_at: new Date().toISOString(),
        next_action: 'Aguardar resposta',
        next_action_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias
      })
      .eq('id', leadId);

    return { 
      success: true, 
      message: 'Sequência de contato iniciada' 
    };
  }

  /**
   * Personaliza template com dados do lead
   */
  private personalizeTemplate(template: string, lead: any): string {
    const replacements: Record<string, string> = {
      '{{company_name}}': lead.company_name || 'sua empresa',
      '{{contact_name}}': lead.contact_name || 'Prezado(a)',
      '{{contact_role}}': lead.contact_role || 'responsável',
      '{{segment}}': lead.segment || 'seu segmento',
      '{{sender_name}}': 'Equipe Valle 360',
      '{{sender_role}}': 'Consultor de Marketing Digital',
      '{{sender_phone}}': '(11) 99999-9999',
      '{{booking_link}}': 'https://calendly.com/valle360'
    };

    let result = template;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(key, 'g'), value);
    });

    return result;
  }

  /**
   * Processa resposta de lead e detecta intenção
   */
  async processLeadResponse(
    leadId: string,
    responseContent: string,
    channel: string
  ): Promise<{
    intent: string;
    confidence: number;
    action: string;
    actionDetails?: any;
  }> {
    // Detecção de intenção simplificada (em produção usaria IA)
    const lowerContent = responseContent.toLowerCase();
    
    let intent = 'unknown';
    let confidence = 0;
    let action = 'none';
    let actionDetails: any = {};

    // Detectar interesse em reunião
    const meetingKeywords = ['reunião', 'conversar', 'agendar', 'horário', 'disponível', 'ligar', 'marcar'];
    if (meetingKeywords.some(k => lowerContent.includes(k))) {
      intent = 'meeting_request';
      confidence = 85;
      action = 'schedule_meeting';
      actionDetails = { suggestSlots: true };
    }

    // Detectar interesse geral
    const interestKeywords = ['interessante', 'gostaria', 'saber mais', 'proposta', 'valores', 'preços'];
    if (interestKeywords.some(k => lowerContent.includes(k))) {
      intent = 'interested';
      confidence = 75;
      action = 'send_proposal';
    }

    // Detectar desinteresse
    const notInterestedKeywords = ['não tenho interesse', 'não preciso', 'remover', 'parar', 'cancelar'];
    if (notInterestedKeywords.some(k => lowerContent.includes(k))) {
      intent = 'not_interested';
      confidence = 90;
      action = 'mark_lost';
    }

    // Registrar interação com análise
    await supabase
      .from('lead_interactions')
      .insert({
        lead_id: leadId,
        type: 'response_received',
        channel,
        content: responseContent,
        status: 'replied',
        detected_intent: intent,
        intent_confidence: confidence,
        action_generated: action,
        action_details: actionDetails,
        response_at: new Date().toISOString()
      });

    // Executar ação automaticamente
    if (action === 'schedule_meeting') {
      await this.createMeetingRequest(leadId);
    }

    return { intent, confidence, action, actionDetails };
  }

  /**
   * Cria solicitação de reunião e notifica comercial
   */
  async createMeetingRequest(leadId: string): Promise<void> {
    // Buscar lead
    const { data: lead } = await supabase
      .from('prospecting_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return;

    // Atualizar status
    await supabase
      .from('prospecting_leads')
      .update({
        status: 'meeting_scheduled',
        next_action: 'Agendar reunião',
        next_action_date: new Date().toISOString()
      })
      .eq('id', leadId);

    // Criar card no Kanban (simulado - integrar com sistema real)
    console.log('📋 Criar card no Kanban para:', lead.company_name);

    // Enviar notificação para comercial (simulado)
    console.log('🔔 Notificar comercial:', {
      title: 'Nova reunião solicitada!',
      message: `${lead.company_name} quer agendar uma reunião`,
      lead_id: leadId
    });

    // Registrar no banco de notificações se existir
    try {
      await supabase
        .from('goal_alerts')
        .insert({
          collaborator_id: lead.assigned_to || 'comercial',
          type: 'meeting_request',
          severity: 'info',
          title: 'Nova reunião solicitada!',
          message: `${lead.company_name} demonstrou interesse e quer agendar uma reunião.`,
          suggested_action: 'Entrar em contato em até 24h',
          action_url: `/admin/prospeccao/leads/${leadId}`
        });
    } catch (e) {
      // Tabela pode não existir
    }
  }

  /**
   * Executa follow-up automático em leads sem resposta
   */
  async executeFollowUps(): Promise<{ processed: number; contacted: number }> {
    let processed = 0;
    let contacted = 0;

    // Buscar leads que precisam de follow-up
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    const { data: leads } = await supabase
      .from('prospecting_leads')
      .select('*')
      .eq('status', 'contacted')
      .lt('last_interaction_at', threeDaysAgo.toISOString())
      .lte('interactions_count', 3); // Máximo 3 tentativas

    if (!leads) return { processed, contacted };

    for (const lead of leads) {
      processed++;

      // Buscar template de follow-up
      const { data: template } = await supabase
        .from('prospecting_templates')
        .select('*')
        .eq('purpose', 'followup')
        .eq('channel', 'email')
        .single();

      if (!template) continue;

      // Gerar e registrar follow-up
      const content = this.personalizeTemplate(template.content, lead);
      
      await supabase
        .from('lead_interactions')
        .insert({
          lead_id: lead.id,
          type: 'email_sent',
          channel: 'email',
          content,
          template_id: template.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      // Atualizar lead
      await supabase
        .from('prospecting_leads')
        .update({
          interactions_count: lead.interactions_count + 1,
          last_interaction_at: new Date().toISOString(),
          next_action: lead.interactions_count >= 2 ? 'Último follow-up' : 'Aguardar resposta',
          next_action_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', lead.id);

      contacted++;
    }

    return { processed, contacted };
  }

  /**
   * Obtém estatísticas de prospecção
   */
  async getStats(): Promise<{
    totalLeads: number;
    byStatus: Record<string, number>;
    bySegment: Record<string, number>;
    conversionRate: number;
    avgQualificationScore: number;
  }> {
    const { data: leads } = await supabase
      .from('prospecting_leads')
      .select('*');

    if (!leads) {
      return {
        totalLeads: 0,
        byStatus: {},
        bySegment: {},
        conversionRate: 0,
        avgQualificationScore: 0
      };
    }

    const byStatus: Record<string, number> = {};
    const bySegment: Record<string, number> = {};
    let totalScore = 0;
    let wonCount = 0;

    leads.forEach(lead => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySegment[lead.segment] = (bySegment[lead.segment] || 0) + 1;
      totalScore += lead.qualification_score || 0;
      if (lead.status === 'won') wonCount++;
    });

    return {
      totalLeads: leads.length,
      byStatus,
      bySegment,
      conversionRate: leads.length > 0 ? (wonCount / leads.length) * 100 : 0,
      avgQualificationScore: leads.length > 0 ? totalScore / leads.length : 0
    };
  }
}

export const prospectingAutomation = new ProspectingAutomation();
export default prospectingAutomation;

