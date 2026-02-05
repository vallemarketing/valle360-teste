/**
 * Valle AI - Ads Integration Service
 * Integração com Meta Ads e Google Ads
 */

import { supabase } from '@/lib/supabase';

// Tipos para Meta Ads
export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: 'active' | 'disabled' | 'unsettled';
  spend_cap?: number;
  amount_spent: number;
  balance: number;
}

export interface MetaCampaign {
  id: string;
  account_id: string;
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  insights?: CampaignInsights;
}

// Tipos para Google Ads
export interface GoogleAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  budget?: number;
  cost: number;
}

export interface GoogleCampaign {
  id: string;
  account_id: string;
  name: string;
  type: 'SEARCH' | 'DISPLAY' | 'VIDEO' | 'SHOPPING' | 'PERFORMANCE_MAX';
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  budget: number;
  bidding_strategy: string;
  start_date?: string;
  end_date?: string;
  insights?: CampaignInsights;
}

// Insights compartilhados
export interface CampaignInsights {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  cost_per_conversion?: number;
  roas?: number;
  reach?: number;
  frequency?: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface AdPerformanceReport {
  account_id: string;
  account_name: string;
  platform: 'meta' | 'google';
  period: string;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_cpc: number;
  total_conversions: number;
  avg_roas: number;
  campaigns: Array<{
    id: string;
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  recommendations: string[];
}

export interface BudgetAlert {
  id?: string;
  account_id: string;
  platform: 'meta' | 'google';
  alert_type: 'budget_low' | 'budget_depleted' | 'overspend' | 'performance_drop';
  message: string;
  threshold_value: number;
  current_value: number;
  created_at: string;
  acknowledged: boolean;
}

class AdsIntegrationService {
  // Credenciais seriam armazenadas de forma segura
  private metaAccessToken?: string;
  private googleCredentials?: any;

  /**
   * Configura credenciais Meta
   */
  setMetaCredentials(accessToken: string): void {
    this.metaAccessToken = accessToken;
  }

  /**
   * Configura credenciais Google
   */
  setGoogleCredentials(credentials: any): void {
    this.googleCredentials = credentials;
  }

  // ========== META ADS ==========

  /**
   * Busca contas de anúncios Meta
   */
  async getMetaAdAccounts(clientId: string): Promise<MetaAdAccount[]> {
    // Em produção, faria chamada real à Meta Graph API
    // GET /{user-id}/adaccounts
    
    // Mock para demonstração
    return [
      {
        id: 'act_123456789',
        name: 'Conta Principal',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        status: 'active',
        spend_cap: 50000,
        amount_spent: 12500,
        balance: 37500
      }
    ];
  }

  /**
   * Busca campanhas Meta
   */
  async getMetaCampaigns(accountId: string): Promise<MetaCampaign[]> {
    // Em produção: GET /{ad-account-id}/campaigns
    
    return [
      {
        id: 'camp_001',
        account_id: accountId,
        name: 'Campanha Black Friday',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
        daily_budget: 500,
        start_time: '2024-11-20T00:00:00',
        stop_time: '2024-11-30T23:59:59',
        created_time: '2024-11-15T10:00:00',
        insights: {
          impressions: 125000,
          clicks: 4500,
          ctr: 3.6,
          spend: 3500,
          cpc: 0.78,
          cpm: 28,
          conversions: 180,
          cost_per_conversion: 19.44,
          roas: 4.2,
          reach: 85000,
          frequency: 1.47,
          date_range: { start: '2024-11-20', end: '2024-11-27' }
        }
      },
      {
        id: 'camp_002',
        account_id: accountId,
        name: 'Remarketing - Carrinho Abandonado',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
        daily_budget: 200,
        created_time: '2024-10-01T10:00:00',
        insights: {
          impressions: 45000,
          clicks: 2200,
          ctr: 4.89,
          spend: 1400,
          cpc: 0.64,
          cpm: 31.11,
          conversions: 95,
          cost_per_conversion: 14.74,
          roas: 6.8,
          reach: 12000,
          frequency: 3.75,
          date_range: { start: '2024-11-01', end: '2024-11-27' }
        }
      }
    ];
  }

  /**
   * Cria campanha Meta
   */
  async createMetaCampaign(accountId: string, campaign: Partial<MetaCampaign>): Promise<MetaCampaign | null> {
    // Em produção: POST /{ad-account-id}/campaigns
    console.log(`[META] Criando campanha: ${campaign.name}`);
    
    return {
      id: `camp_${Date.now()}`,
      account_id: accountId,
      name: campaign.name || 'Nova Campanha',
      objective: campaign.objective || 'CONVERSIONS',
      status: 'PAUSED',
      daily_budget: campaign.daily_budget,
      created_time: new Date().toISOString()
    };
  }

  /**
   * Pausa/Ativa campanha Meta
   */
  async updateMetaCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<boolean> {
    // Em produção: POST /{campaign-id}
    console.log(`[META] Atualizando campanha ${campaignId} para ${status}`);
    return true;
  }

  // ========== GOOGLE ADS ==========

  /**
   * Busca contas Google Ads
   */
  async getGoogleAdAccounts(clientId: string): Promise<GoogleAdAccount[]> {
    // Em produção, usaria Google Ads API
    
    return [
      {
        id: '123-456-7890',
        name: 'Conta Google Ads Principal',
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        status: 'ENABLED',
        budget: 30000,
        cost: 8500
      }
    ];
  }

  /**
   * Busca campanhas Google
   */
  async getGoogleCampaigns(accountId: string): Promise<GoogleCampaign[]> {
    return [
      {
        id: 'gcamp_001',
        account_id: accountId,
        name: 'Search - Marca',
        type: 'SEARCH',
        status: 'ENABLED',
        budget: 100,
        bidding_strategy: 'TARGET_CPA',
        insights: {
          impressions: 35000,
          clicks: 2800,
          ctr: 8.0,
          spend: 2100,
          cpc: 0.75,
          cpm: 60,
          conversions: 120,
          cost_per_conversion: 17.50,
          roas: 5.5,
          date_range: { start: '2024-11-01', end: '2024-11-27' }
        }
      },
      {
        id: 'gcamp_002',
        account_id: accountId,
        name: 'Performance Max',
        type: 'PERFORMANCE_MAX',
        status: 'ENABLED',
        budget: 150,
        bidding_strategy: 'MAXIMIZE_CONVERSIONS',
        insights: {
          impressions: 180000,
          clicks: 5400,
          ctr: 3.0,
          spend: 4200,
          cpc: 0.78,
          cpm: 23.33,
          conversions: 210,
          cost_per_conversion: 20.00,
          roas: 4.8,
          date_range: { start: '2024-11-01', end: '2024-11-27' }
        }
      }
    ];
  }

  /**
   * Cria campanha Google
   */
  async createGoogleCampaign(accountId: string, campaign: Partial<GoogleCampaign>): Promise<GoogleCampaign | null> {
    console.log(`[GOOGLE] Criando campanha: ${campaign.name}`);
    
    return {
      id: `gcamp_${Date.now()}`,
      account_id: accountId,
      name: campaign.name || 'Nova Campanha',
      type: campaign.type || 'SEARCH',
      status: 'PAUSED',
      budget: campaign.budget || 100,
      bidding_strategy: campaign.bidding_strategy || 'MANUAL_CPC'
    };
  }

  // ========== FUNCIONALIDADES COMPARTILHADAS ==========

  /**
   * Gera relatório de performance consolidado
   */
  async generatePerformanceReport(
    clientId: string,
    platform: 'meta' | 'google' | 'all',
    dateRange: { start: string; end: string }
  ): Promise<AdPerformanceReport[]> {
    const reports: AdPerformanceReport[] = [];

    if (platform === 'meta' || platform === 'all') {
      const metaAccounts = await this.getMetaAdAccounts(clientId);
      for (const account of metaAccounts) {
        const campaigns = await this.getMetaCampaigns(account.id);
        
        const totalSpend = campaigns.reduce((acc, c) => acc + (c.insights?.spend || 0), 0);
        const totalImpressions = campaigns.reduce((acc, c) => acc + (c.insights?.impressions || 0), 0);
        const totalClicks = campaigns.reduce((acc, c) => acc + (c.insights?.clicks || 0), 0);
        const totalConversions = campaigns.reduce((acc, c) => acc + (c.insights?.conversions || 0), 0);

        reports.push({
          account_id: account.id,
          account_name: account.name,
          platform: 'meta',
          period: `${dateRange.start} a ${dateRange.end}`,
          total_spend: totalSpend,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
          total_conversions: totalConversions,
          avg_roas: this.calculateAvgRoas(campaigns),
          campaigns: campaigns.map(c => ({
            id: c.id,
            name: c.name,
            spend: c.insights?.spend || 0,
            impressions: c.insights?.impressions || 0,
            clicks: c.insights?.clicks || 0,
            conversions: c.insights?.conversions || 0
          })),
          recommendations: this.generateRecommendations(campaigns, 'meta')
        });
      }
    }

    if (platform === 'google' || platform === 'all') {
      const googleAccounts = await this.getGoogleAdAccounts(clientId);
      for (const account of googleAccounts) {
        const campaigns = await this.getGoogleCampaigns(account.id);
        
        const totalSpend = campaigns.reduce((acc, c) => acc + (c.insights?.spend || 0), 0);
        const totalImpressions = campaigns.reduce((acc, c) => acc + (c.insights?.impressions || 0), 0);
        const totalClicks = campaigns.reduce((acc, c) => acc + (c.insights?.clicks || 0), 0);
        const totalConversions = campaigns.reduce((acc, c) => acc + (c.insights?.conversions || 0), 0);

        reports.push({
          account_id: account.id,
          account_name: account.name,
          platform: 'google',
          period: `${dateRange.start} a ${dateRange.end}`,
          total_spend: totalSpend,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
          total_conversions: totalConversions,
          avg_roas: this.calculateAvgRoas(campaigns as any),
          campaigns: campaigns.map(c => ({
            id: c.id,
            name: c.name,
            spend: c.insights?.spend || 0,
            impressions: c.insights?.impressions || 0,
            clicks: c.insights?.clicks || 0,
            conversions: c.insights?.conversions || 0
          })),
          recommendations: this.generateRecommendations(campaigns as any, 'google')
        });
      }
    }

    return reports;
  }

  /**
   * Verifica alertas de orçamento
   */
  async checkBudgetAlerts(clientId: string): Promise<BudgetAlert[]> {
    const alerts: BudgetAlert[] = [];

    // Verifica Meta
    const metaAccounts = await this.getMetaAdAccounts(clientId);
    for (const account of metaAccounts) {
      const usagePercent = account.spend_cap 
        ? (account.amount_spent / account.spend_cap) * 100 
        : 0;

      if (usagePercent >= 90) {
        alerts.push({
          account_id: account.id,
          platform: 'meta',
          alert_type: usagePercent >= 100 ? 'budget_depleted' : 'budget_low',
          message: usagePercent >= 100 
            ? `Orçamento da conta ${account.name} esgotado!`
            : `Orçamento da conta ${account.name} em ${usagePercent.toFixed(0)}%`,
          threshold_value: account.spend_cap || 0,
          current_value: account.amount_spent,
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }
    }

    // Verifica Google
    const googleAccounts = await this.getGoogleAdAccounts(clientId);
    for (const account of googleAccounts) {
      const usagePercent = account.budget 
        ? (account.cost / account.budget) * 100 
        : 0;

      if (usagePercent >= 90) {
        alerts.push({
          account_id: account.id,
          platform: 'google',
          alert_type: usagePercent >= 100 ? 'budget_depleted' : 'budget_low',
          message: usagePercent >= 100 
            ? `Orçamento da conta ${account.name} esgotado!`
            : `Orçamento da conta ${account.name} em ${usagePercent.toFixed(0)}%`,
          threshold_value: account.budget || 0,
          current_value: account.cost,
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }
    }

    // Salva alertas no banco
    if (alerts.length > 0) {
      await supabase.from('budget_alerts').insert(alerts);
    }

    return alerts;
  }

  /**
   * Envia notificação de recarga para cliente
   */
  async sendRechargeNotification(clientId: string, accountId: string, platform: string): Promise<boolean> {
    try {
      // Busca dados do cliente
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (!client) return false;

      // Cria notificação
      const clientUserId = client.user_id ? String(client.user_id) : null;
      if (clientUserId) {
        await supabase.from('notifications').insert({
          user_id: clientUserId,
          type: 'budget_recharge',
          title: '💰 Recarga de Orçamento Necessária',
          message: `O orçamento da sua conta de ${platform === 'meta' ? 'Meta Ads' : 'Google Ads'} está baixo. Recarregue para manter suas campanhas ativas.`,
          link: '/cliente/financeiro',
          metadata: { client_id: clientId, account_id: accountId, platform },
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      // Em produção, enviaria também por email/WhatsApp
      console.log(`[NOTIFICAÇÃO] Recarga enviada para ${client.email}`);

      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  }

  /**
   * Analisa biblioteca de anúncios dos concorrentes
   */
  async analyzeCompetitorAds(competitorPage: string): Promise<{
    total_ads: number;
    active_ads: number;
    ad_formats: Record<string, number>;
    themes: string[];
    avg_duration_days: number;
  }> {
    // Em produção, usaria Meta Ad Library API
    // GET /ads_archive?ad_reached_countries=['BR']&search_page_ids=[page_id]

    // Mock para demonstração
    return {
      total_ads: Math.floor(Math.random() * 50) + 10,
      active_ads: Math.floor(Math.random() * 20) + 5,
      ad_formats: {
        'image': Math.floor(Math.random() * 15) + 5,
        'video': Math.floor(Math.random() * 10) + 3,
        'carousel': Math.floor(Math.random() * 8) + 2
      },
      themes: ['Promoção', 'Lançamento', 'Institucional', 'Depoimentos'],
      avg_duration_days: Math.floor(Math.random() * 30) + 7
    };
  }

  // Métodos auxiliares
  private calculateAvgRoas(campaigns: any[]): number {
    const roasValues = campaigns
      .map(c => c.insights?.roas)
      .filter(r => r !== undefined && r !== null);
    
    if (roasValues.length === 0) return 0;
    return roasValues.reduce((a, b) => a + b, 0) / roasValues.length;
  }

  private generateRecommendations(campaigns: any[], platform: string): string[] {
    const recommendations: string[] = [];

    for (const campaign of campaigns) {
      if (!campaign.insights) continue;

      // CTR baixo
      if (campaign.insights.ctr < 1) {
        recommendations.push(`${campaign.name}: CTR baixo (${campaign.insights.ctr.toFixed(2)}%). Considere revisar criativos e segmentação.`);
      }

      // CPC alto
      if (campaign.insights.cpc > 2) {
        recommendations.push(`${campaign.name}: CPC elevado (R$ ${campaign.insights.cpc.toFixed(2)}). Teste novos públicos ou ajuste lances.`);
      }

      // ROAS baixo
      if (campaign.insights.roas && campaign.insights.roas < 2) {
        recommendations.push(`${campaign.name}: ROAS abaixo do ideal (${campaign.insights.roas.toFixed(1)}x). Revise funil de conversão.`);
      }

      // Frequência alta (Meta)
      if (campaign.insights.frequency && campaign.insights.frequency > 3) {
        recommendations.push(`${campaign.name}: Frequência alta (${campaign.insights.frequency.toFixed(1)}). Expanda o público ou pause para evitar fadiga.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Campanhas com performance saudável. Continue monitorando.');
    }

    return recommendations.slice(0, 5);
  }
}

export const adsIntegration = new AdsIntegrationService();
export default adsIntegration;




