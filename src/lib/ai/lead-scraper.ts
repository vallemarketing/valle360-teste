/**
 * Valle AI - Lead Scraper Service
 * Sistema de scraping e identificação de leads potenciais
 * CONECTADO AO TAVILY PARA DADOS REAIS
 */

import { tavilyClient } from '@/lib/integrations/tavily/client';
import { generateWithAI } from '@/lib/ai/aiRouter';

export interface Lead {
  id?: string;
  company_name: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  location?: string;
  social_media?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  source: 'scraping' | 'referral' | 'inbound' | 'outbound' | 'event' | 'manual';
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to?: string;
  ai_insights?: {
    potential_services?: string[];
    estimated_value?: number;
    conversion_probability?: number;
    best_approach?: string;
    competitors_using?: string[];
  };
}

export interface ScrapingConfig {
  industry?: string;
  location?: string;
  min_employees?: number;
  max_employees?: number;
  has_website?: boolean;
  has_social_media?: boolean;
  keywords?: string[];
}

export interface ScrapingResult {
  success: boolean;
  leads: Lead[];
  total_found: number;
  source: string;
  timestamp: string;
}

class LeadScraperService {
  /**
   * Busca leads baseado em critérios usando Tavily
   */
  async searchLeads(config: ScrapingConfig): Promise<ScrapingResult> {
    try {
      // Construir query de busca
      let query = 'empresas';
      if (config.industry) query += ` ${config.industry}`;
      if (config.location) query += ` em ${config.location}`;
      if (config.keywords?.length) query += ` ${config.keywords.join(' ')}`;
      query += ' contato site email';

      // Buscar com Tavily
      const searchResults = await tavilyClient.search({
        query,
        searchDepth: 'advanced',
        maxResults: 20,
        includeAnswer: true
      });

      // Processar resultados com IA
      const leads = await this.processSearchResults(searchResults.results, config);

      return {
        success: true,
        leads,
        total_found: leads.length,
        source: 'tavily_search',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Erro no scraping de leads:', error);
      return {
        success: false,
        leads: [],
        total_found: 0,
        source: 'tavily_search',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Processa resultados de busca e extrai leads
   */
  private async processSearchResults(
    results: any[],
    config: ScrapingConfig
  ): Promise<Lead[]> {
    const systemPrompt = `Você é um especialista em qualificação de leads B2B.
Analise os resultados de busca e extraia informações de empresas potenciais.

Para cada empresa encontrada, retorne:
{
  "leads": [
    {
      "company_name": "Nome da empresa",
      "website": "URL se encontrada",
      "industry": "Setor",
      "location": "Cidade/Estado",
      "description": "Breve descrição",
      "score": 0-100 (potencial como lead),
      "potential_services": ["serviços que podem precisar"],
      "notes": "Observações relevantes"
    }
  ]
}

Critérios de qualificação:
- Empresas com presença digital ativa = maior score
- Empresas do setor ${config.industry || 'diversos'} = maior score
- Empresas em ${config.location || 'Brasil'} = maior score`;

    try {
      const result = await generateWithAI({
        task: 'sales',
        json: true,
        temperature: 0.3,
        maxTokens: 1400,
        entityType: 'lead_scraper',
        entityId: null,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(results.map(r => ({
            title: r.title,
            url: r.url,
            content: r.content
          }))) }
        ],
      });

      const parsed = result.json || {};
      
      return (parsed.leads || []).map((lead: any) => ({
        company_name: lead.company_name,
        website: lead.website,
        industry: lead.industry || config.industry,
        location: lead.location || config.location,
        score: lead.score || 50,
        status: 'new' as const,
        source: 'scraping' as const,
        notes: lead.notes,
        ai_insights: {
          potential_services: lead.potential_services || [],
          conversion_probability: lead.score / 100,
          best_approach: lead.notes
        }
      }));
    } catch (error) {
      console.error('Erro ao processar resultados:', error);
      return [];
    }
  }

  /**
   * Enriquece dados de um lead
   */
  async enrichLead(lead: Lead): Promise<Lead> {
    try {
      // Buscar mais informações sobre a empresa
      const [companyInfo, socialInfo, reputationInfo] = await Promise.all([
        tavilyClient.searchCompany(lead.company_name),
        tavilyClient.searchSocialMedia(lead.company_name),
        tavilyClient.searchReputation(lead.company_name)
      ]);

      // Processar com IA
      const result = await generateWithAI({
        task: 'sales',
        json: true,
        temperature: 0.3,
        maxTokens: 1400,
        entityType: 'lead_enrich',
        entityId: null,
        messages: [
          { 
            role: 'system', 
            content: `Analise as informações e extraia dados estruturados da empresa.
Retorne JSON:
{
  "website": "url principal",
  "email": "email de contato se encontrado",
  "phone": "telefone se encontrado",
  "social_media": {
    "instagram": "@handle ou url",
    "facebook": "url",
    "linkedin": "url"
  },
  "size": "small/medium/large/enterprise",
  "industry": "setor",
  "score_adjustment": -20 a +20 (baseado na reputação),
  "insights": {
    "potential_services": ["serviços recomendados"],
    "best_approach": "melhor abordagem de vendas",
    "competitors_using": ["concorrentes que usam marketing digital"]
  }
}`
          },
          { 
            role: 'user', 
            content: JSON.stringify({
              company: lead.company_name,
              companyResults: companyInfo.results.slice(0, 5),
              socialResults: socialInfo.results.slice(0, 5),
              reputationResults: reputationInfo.results.slice(0, 5)
            })
          }
        ],
      });

      const enrichment = result.json || {};

      return {
        ...lead,
        website: enrichment.website || lead.website,
        email: enrichment.email || lead.email,
        phone: enrichment.phone || lead.phone,
        social_media: enrichment.social_media || lead.social_media,
        size: enrichment.size || lead.size,
        industry: enrichment.industry || lead.industry,
        score: Math.max(0, Math.min(100, lead.score + (enrichment.score_adjustment || 0))),
        ai_insights: {
          ...lead.ai_insights,
          ...enrichment.insights
        }
      };
    } catch (error) {
      console.error('Erro ao enriquecer lead:', error);
      return lead;
    }
  }

  /**
   * Busca leads em um setor específico
   */
  async findLeadsByIndustry(industry: string, location?: string): Promise<ScrapingResult> {
    return this.searchLeads({
      industry,
      location,
      keywords: ['marketing digital', 'precisa marketing', 'quer crescer', 'sem presença online']
    });
  }

  /**
   * Busca leads que precisam de marketing digital
   */
  async findLeadsNeedingMarketing(location?: string): Promise<ScrapingResult> {
    return this.searchLeads({
      location,
      keywords: ['empresa sem site', 'sem redes sociais', 'precisa divulgação', 'quer vender mais online']
    });
  }

  /**
   * Busca leads do banco de dados com filtros opcionais
   */
  async getLeads(filters: {
    status?: string;
    industry?: string;
    min_score?: number;
    assigned_to?: string;
  }): Promise<Lead[]> {
    // Retorna mock data por enquanto (em produção, buscar do Supabase)
    const mockLeads: Lead[] = [
      {
        id: '1',
        company_name: 'Tech Solutions SP',
        website: 'www.techsolutions.com.br',
        email: 'contato@techsolutions.com.br',
        phone: '(11) 99999-8888',
        industry: 'Tecnologia',
        size: 'medium',
        location: 'São Paulo, SP',
        score: 85,
        status: 'qualified',
        source: 'scraping',
        tags: ['b2b', 'software'],
        created_at: new Date().toISOString(),
        ai_insights: {
          potential_services: ['Social Media', 'Tráfego Pago'],
          estimated_value: 5000,
          conversion_probability: 0.75
        }
      },
      {
        id: '2',
        company_name: 'Boutique Fashion',
        website: 'www.boutiquefashion.com.br',
        email: 'vendas@boutiquefashion.com.br',
        phone: '(21) 98888-7777',
        industry: 'Moda',
        size: 'small',
        location: 'Rio de Janeiro, RJ',
        score: 72,
        status: 'new',
        source: 'scraping',
        tags: ['ecommerce', 'varejo'],
        created_at: new Date().toISOString(),
        ai_insights: {
          potential_services: ['E-commerce', 'Instagram Ads'],
          estimated_value: 3500,
          conversion_probability: 0.60
        }
      },
      {
        id: '3',
        company_name: 'Restaurante Sabor & Arte',
        email: 'contato@saborarte.com.br',
        phone: '(11) 97777-6666',
        industry: 'Restaurante',
        size: 'small',
        location: 'São Paulo, SP',
        score: 90,
        status: 'proposal',
        source: 'referral',
        tags: ['food', 'local'],
        created_at: new Date().toISOString(),
        ai_insights: {
          potential_services: ['Google Meu Negócio', 'Social Media'],
          estimated_value: 2500,
          conversion_probability: 0.85
        }
      }
    ];

    // Aplicar filtros
    let filteredLeads = mockLeads;

    if (filters.status) {
      filteredLeads = filteredLeads.filter(l => l.status === filters.status);
    }
    if (filters.industry) {
      filteredLeads = filteredLeads.filter(l => 
        l.industry?.toLowerCase().includes(filters.industry!.toLowerCase())
      );
    }
    if (filters.min_score) {
      filteredLeads = filteredLeads.filter(l => l.score >= filters.min_score!);
    }
    if (filters.assigned_to) {
      filteredLeads = filteredLeads.filter(l => l.assigned_to === filters.assigned_to);
    }

    return filteredLeads;
  }

  /**
   * Gera mensagem de abordagem personalizada para um lead
   */
  generateOutreachMessage(lead: Lead, template: string = 'initial'): string {
    const templates: Record<string, string> = {
      initial: `Olá! Notamos que a ${lead.company_name} tem um grande potencial no setor de ${lead.industry || 'negócios'}. 

Somos a Valle 360, especialistas em marketing digital e gostaríamos de apresentar soluções que podem impulsionar seus resultados.

${lead.ai_insights?.potential_services?.length ? `Identificamos oportunidades em: ${lead.ai_insights.potential_services.join(', ')}.` : ''}

Podemos agendar uma conversa rápida de 15 minutos?

Atenciosamente,
Equipe Valle 360`,
      
      followup: `Olá! Estou fazendo um acompanhamento do nosso contato anterior.

A ${lead.company_name} continua sendo uma empresa com perfil ideal para nossas soluções de marketing digital.

Gostaria de retomar nossa conversa. Qual o melhor horário para você?

Atenciosamente,
Equipe Valle 360`,

      proposal: `Olá! Conforme conversamos, segue nossa proposta para a ${lead.company_name}.

Com base na análise do seu negócio, preparamos um plano personalizado que pode gerar resultados expressivos.

${lead.ai_insights?.estimated_value ? `Investimento estimado: R$ ${lead.ai_insights.estimated_value.toLocaleString('pt-BR')}/mês` : ''}

Aguardo seu retorno para discutirmos os detalhes.

Atenciosamente,
Equipe Valle 360`
    };

    return templates[template] || templates.initial;
  }

  /**
   * Salva um lead no banco de dados
   */
  async saveLead(lead: Lead): Promise<Lead | null> {
    try {
      // Em produção, salvar no Supabase
      // Por enquanto, retorna o lead com ID gerado
      return {
        ...lead,
        id: `lead_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      return null;
    }
  }

  /**
   * Atualiza um lead existente
   */
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      // Em produção, atualizar no Supabase
      return {
        id,
        company_name: updates.company_name || 'Lead Atualizado',
        score: updates.score || 50,
        status: updates.status || 'new',
        source: updates.source || 'manual',
        ...updates,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      return null;
    }
  }

  /**
   * Remove um lead
   */
  async deleteLead(id: string): Promise<boolean> {
    try {
      // Em produção, deletar do Supabase
      console.log(`Lead ${id} removido`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      return false;
    }
  }

  /**
   * Atualiza o score de um lead baseado em interação
   */
  async updateLeadScore(id: string, interaction: string): Promise<void> {
    // Pontuação por tipo de interação
    const scoreChanges: Record<string, number> = {
      email_opened: 5,
      email_clicked: 10,
      email_replied: 20,
      call_answered: 15,
      call_scheduled: 25,
      meeting_scheduled: 30,
      proposal_sent: 20,
      proposal_viewed: 15,
      contract_sent: 25,
      negative_response: -10,
      no_response: -5,
      unsubscribed: -20
    };

    const scoreChange = scoreChanges[interaction] || 0;
    
    // Em produção, atualizar no Supabase
    console.log(`Lead ${id}: score ${scoreChange > 0 ? '+' : ''}${scoreChange} (${interaction})`);
  }
}

export const leadScraper = new LeadScraperService();
export default leadScraper;
