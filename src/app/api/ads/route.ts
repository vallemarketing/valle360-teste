import { NextRequest, NextResponse } from 'next/server';
import { adsIntegration } from '@/lib/ads/ads-integration';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar dados de ads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const client_id = searchParams.get('client_id');
    const platform = searchParams.get('platform') as 'meta' | 'google' | 'all' | null;
    const account_id = searchParams.get('account_id');

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: 'client_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar contas
    if (action === 'accounts') {
      const accounts: any = {};
      
      if (platform === 'meta' || platform === 'all' || !platform) {
        accounts.meta = await adsIntegration.getMetaAdAccounts(client_id);
      }
      if (platform === 'google' || platform === 'all' || !platform) {
        accounts.google = await adsIntegration.getGoogleAdAccounts(client_id);
      }

      return NextResponse.json({ success: true, accounts });
    }

    // Buscar campanhas
    if (action === 'campaigns' && account_id) {
      let campaigns: any[] = [];
      
      if (platform === 'meta') {
        campaigns = await adsIntegration.getMetaCampaigns(account_id);
      } else if (platform === 'google') {
        campaigns = await adsIntegration.getGoogleCampaigns(account_id);
      }

      return NextResponse.json({ success: true, campaigns });
    }

    // Relatório de performance
    if (action === 'report') {
      const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end_date = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

      const reports = await adsIntegration.generatePerformanceReport(
        client_id,
        platform || 'all',
        { start: start_date, end: end_date }
      );

      return NextResponse.json({ success: true, reports });
    }

    // Alertas de orçamento
    if (action === 'budget_alerts') {
      const alerts = await adsIntegration.checkBudgetAlerts(client_id);
      return NextResponse.json({ success: true, alerts });
    }

    // Análise de concorrentes
    if (action === 'competitor_analysis') {
      const competitor_page = searchParams.get('competitor_page');
      if (!competitor_page) {
        return NextResponse.json(
          { success: false, error: 'competitor_page é obrigatório' },
          { status: 400 }
        );
      }

      const analysis = await adsIntegration.analyzeCompetitorAds(competitor_page);
      return NextResponse.json({ success: true, analysis });
    }

    // Retorno padrão - todas as contas
    const metaAccounts = await adsIntegration.getMetaAdAccounts(client_id);
    const googleAccounts = await adsIntegration.getGoogleAdAccounts(client_id);

    return NextResponse.json({
      success: true,
      accounts: {
        meta: metaAccounts,
        google: googleAccounts
      }
    });
  } catch (error) {
    console.error('Erro na API de ads:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}

// POST - Criar campanha ou executar ação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, platform, ...data } = body;

    // Criar campanha Meta
    if (action === 'create_campaign' && platform === 'meta') {
      const campaign = await adsIntegration.createMetaCampaign(data.account_id, {
        name: data.name,
        objective: data.objective,
        daily_budget: data.daily_budget,
        lifetime_budget: data.lifetime_budget,
        start_time: data.start_time,
        stop_time: data.stop_time
      });

      return NextResponse.json({ success: !!campaign, campaign });
    }

    // Criar campanha Google
    if (action === 'create_campaign' && platform === 'google') {
      const campaign = await adsIntegration.createGoogleCampaign(data.account_id, {
        name: data.name,
        type: data.type,
        budget: data.budget,
        bidding_strategy: data.bidding_strategy,
        start_date: data.start_date,
        end_date: data.end_date
      });

      return NextResponse.json({ success: !!campaign, campaign });
    }

    // Enviar notificação de recarga
    if (action === 'send_recharge_notification') {
      const success = await adsIntegration.sendRechargeNotification(
        data.client_id,
        data.account_id,
        data.platform
      );

      return NextResponse.json({ 
        success, 
        message: success ? 'Notificação enviada' : 'Erro ao enviar' 
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro na API de ads:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar campanha
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign_id, platform, action, ...data } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { success: false, error: 'campaign_id é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar status da campanha Meta
    if (action === 'update_status' && platform === 'meta') {
      const success = await adsIntegration.updateMetaCampaignStatus(
        campaign_id,
        data.status
      );

      return NextResponse.json({ 
        success, 
        message: success ? 'Status atualizado' : 'Erro ao atualizar' 
      });
    }

    // Outras atualizações seriam implementadas aqui

    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar' },
      { status: 500 }
    );
  }
}




