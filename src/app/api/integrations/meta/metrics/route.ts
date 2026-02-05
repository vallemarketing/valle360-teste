import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createMetaClient } from '@/lib/integrations/meta/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar configuração da integração
    const { data: config, error: configError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', 'meta_ads')
      .single();

    if (configError || !config || config.status !== 'connected') {
      return NextResponse.json({ 
        error: 'Meta Ads não está conectado',
        needsSetup: true 
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'account';
    const period = searchParams.get('period') || 'last_30d';

    const client = createMetaClient({
      accessToken: config.access_token,
      adAccountId: config.config?.adAccountId
    });

    let result;
    const startTime = Date.now();

    switch (type) {
      case 'account':
        // Métricas gerais da conta
        result = await client.getAdAccountInsights(period as any);
        break;

      case 'campaigns':
        // Lista de campanhas
        result = await client.getAdCampaigns([
          'id', 'name', 'status', 'objective', 
          'daily_budget', 'lifetime_budget', 'created_time'
        ]);
        break;

      case 'campaign':
        // Métricas de uma campanha específica
        const campaignId = searchParams.get('campaignId');
        if (!campaignId) {
          return NextResponse.json({ error: 'Campaign ID é obrigatório' }, { status: 400 });
        }
        result = await client.getCampaignInsights(campaignId, period as any);
        break;

      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const duration = Date.now() - startTime;

    // Registrar log
    await supabase.from('integration_logs').insert({
      integration_id: 'meta_ads',
      action: `get_${type}`,
      status: 'success',
      duration_ms: duration
    });

    // Atualizar last_sync
    await supabase
      .from('integration_configs')
      .update({ last_sync: new Date().toISOString() })
      .eq('integration_id', 'meta_ads');

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        type,
        period,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Erro ao buscar métricas Meta:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar métricas',
      details: error.message 
    }, { status: 500 });
  }
}






