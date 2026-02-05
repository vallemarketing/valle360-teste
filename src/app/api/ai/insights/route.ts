/**
 * Valle 360 - API de Insights de IA
 * Gera insights estratégicos usando IA real
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { 
  generateStrategicInsights, 
  analyzeClientHealth,
  generateFinancialForecast 
} from '@/lib/ai/intelligence-service';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(request: NextRequest) {
  // 1) Cookie auth (auth-helpers)
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { user, supabase };
  } catch {
    // ignore
  }

  // 2) Bearer token (para quando o app está usando storage local e não cookies)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return { user: null as any, supabase: null as any };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null as any, supabase: null as any };

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: { user } } = await supabase.auth.getUser(token);
  return { user, supabase };
}

// POST - Gerar insights
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    let result;

    switch (type) {
      case 'strategic':
        // Buscar dados reais do banco
        const [clientsData, financialData] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('user_type', 'cliente').limit(50),
          supabase.from('contracts').select('value, status, start_date, end_date').eq('status', 'active')
        ]);

        const clients = (clientsData.data || []).map((c: any) => ({
          clientId: c.id,
          clientName: c.full_name || c.email,
          revenue: 0,
          monthlyFee: 0,
          contractStart: new Date().toISOString(),
          pendingTasks: 0,
          overduePayments: 0,
          supportTickets: 0
        }));

        const totalRevenue = (financialData.data || []).reduce(
          (sum: number, c: any) => sum + (c.value || 0),
          0
        );

        result = await generateStrategicInsights({
          clients,
          financial: {
            totalRevenue,
            pendingPayments: 0,
            overduePayments: 0,
            clientsCount: clients.length,
            avgTicket: clients.length > 0 ? totalRevenue / clients.length : 0,
            churnRate: 0.05,
            growthRate: 0.15
          },
          period: data?.period || '30d'
        });
        break;

      case 'client_health':
        if (!data?.clientId) {
          return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
        }

        // Buscar dados do cliente
        const { data: clientInfo } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.clientId)
          .single();

        if (!clientInfo) {
          return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
        }

        result = await analyzeClientHealth({
          clientId: clientInfo.id,
          clientName: clientInfo.full_name || clientInfo.email,
          revenue: data.revenue || 0,
          monthlyFee: data.monthlyFee || 0,
          contractStart: data.contractStart || new Date().toISOString(),
          npsScore: data.npsScore,
          lastInteraction: data.lastInteraction,
          pendingTasks: data.pendingTasks || 0,
          overduePayments: data.overduePayments || 0,
          supportTickets: data.supportTickets || 0,
          sentimentScore: data.sentimentScore
        });
        break;

      case 'financial_forecast':
        // Buscar dados financeiros reais
        const { data: contracts } = await supabase
          .from('contracts')
          .select('value, start_date, status')
          .eq('status', 'active');

        const revenue = (contracts || []).reduce((sum: number, c: any) => sum + (c.value || 0), 0);

        result = await generateFinancialForecast({
          totalRevenue: revenue,
          pendingPayments: data?.pendingPayments || 0,
          overduePayments: data?.overduePayments || 0,
          clientsCount: (contracts || []).length,
          avgTicket: (contracts || []).length > 0 ? revenue / (contracts || []).length : 0,
          churnRate: data?.churnRate || 0.05,
          growthRate: data?.growthRate || 0.10,
          historicalData: data?.historicalData
        });
        break;

      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Erro na API de insights:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerar insights',
      details: error.message 
    }, { status: 500 });
  }
}
