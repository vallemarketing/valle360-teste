import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    
    // Check if user is admin/super_admin
    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const role = (profile as any)?.role;
    if (!['super_admin', 'admin', 'gerente', 'diretoria'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    // Fetch metrics
    let metrics = {
      revenue: {
        current: 0,
        previous: 0,
        change: 0,
        target: 0,
        progress: 0,
      },
      clients: {
        total: 0,
        active: 0,
        new_this_month: 0,
        churn_rate: 0,
        health_avg: 0,
      },
      operations: {
        tasks_completed: 0,
        tasks_pending: 0,
        sla_compliance: 0,
        avg_delivery_time: 0,
      },
      finance: {
        mrr: 0,
        arr: 0,
        overdue_invoices: 0,
        overdue_amount: 0,
        collection_rate: 0,
      },
      team: {
        total_members: 0,
        productivity_score: 0,
        utilization_rate: 0,
      },
    };

    try {
      // Revenue from invoices
      const { data: currentInvoices } = await admin
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', startDate.toISOString());
      
      metrics.revenue.current = (currentInvoices || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

      const { data: previousInvoices } = await admin
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', previousStartDate.toISOString())
        .lt('paid_at', previousEndDate.toISOString());
      
      metrics.revenue.previous = (previousInvoices || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
      
      metrics.revenue.change = metrics.revenue.previous > 0 
        ? Math.round(((metrics.revenue.current - metrics.revenue.previous) / metrics.revenue.previous) * 100 * 10) / 10
        : 0;
      
      // Revenue target (could come from settings)
      metrics.revenue.target = metrics.revenue.current * 1.1; // 10% above current as default
      metrics.revenue.progress = Math.min(100, Math.round((metrics.revenue.current / metrics.revenue.target) * 100));

      // Clients
      const { count: totalClients } = await admin
        .from('clients')
        .select('id', { count: 'exact', head: true });
      
      const { count: activeClients } = await admin
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const { count: newClients } = await admin
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());
      
      metrics.clients.total = totalClients || 0;
      metrics.clients.active = activeClients || 0;
      metrics.clients.new_this_month = newClients || 0;
      metrics.clients.churn_rate = 2.5; // Would calculate from churned clients
      metrics.clients.health_avg = 8.0; // Would calculate from client_health_scores

      // Operations
      const { count: completedTasks } = await admin
        .from('kanban_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'done')
        .gte('updated_at', startDate.toISOString());
      
      const { count: pendingTasks } = await admin
        .from('kanban_tasks')
        .select('id', { count: 'exact', head: true })
        .not('status', 'eq', 'done');
      
      metrics.operations.tasks_completed = completedTasks || 0;
      metrics.operations.tasks_pending = pendingTasks || 0;
      metrics.operations.sla_compliance = 94.5; // Would calculate from actual SLA data
      metrics.operations.avg_delivery_time = 2.3;

      // Finance
      metrics.finance.mrr = metrics.revenue.current;
      metrics.finance.arr = metrics.finance.mrr * 12;
      
      const { data: overdueData, count: overdueCount } = await admin
        .from('invoices')
        .select('amount', { count: 'exact' })
        .eq('status', 'pending')
        .lt('due_date', now.toISOString());
      
      metrics.finance.overdue_invoices = overdueCount || 0;
      metrics.finance.overdue_amount = (overdueData || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
      metrics.finance.collection_rate = 96.5;

      // Team
      const { count: teamCount } = await admin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .in('role', ['colaborador', 'gerente', 'admin']);
      
      metrics.team.total_members = teamCount || 0;
      metrics.team.productivity_score = 87;
      metrics.team.utilization_rate = 78;

    } catch (e) {
      console.error('Error fetching metrics:', e);
    }

    // Top clients
    let topClients: any[] = [];
    try {
      const { data: clients } = await admin
        .from('clients')
        .select('id, company_name, nome_fantasia')
        .eq('status', 'active')
        .limit(10);
      
      // Get revenue for each client
      for (const client of clients || []) {
        const { data: invoices } = await admin
          .from('invoices')
          .select('amount')
          .eq('client_id', (client as any).id)
          .eq('status', 'paid')
          .gte('paid_at', startDate.toISOString());
        
        const revenue = (invoices || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        
        topClients.push({
          id: (client as any).id,
          name: (client as any).company_name || (client as any).nome_fantasia || 'Cliente',
          revenue,
          health: 8 + Math.random() * 2, // Would come from health scores
          change: Math.floor(Math.random() * 20) - 5,
        });
      }
      
      topClients.sort((a, b) => b.revenue - a.revenue);
      topClients = topClients.slice(0, 5);
    } catch (e) {
      console.error('Error fetching top clients:', e);
    }

    // Alerts
    const alerts: any[] = [];
    
    if (metrics.finance.overdue_invoices > 0) {
      alerts.push({
        id: 'overdue',
        type: 'critical',
        title: `${metrics.finance.overdue_invoices} faturas vencidas`,
        description: `R$ ${metrics.finance.overdue_amount.toLocaleString('pt-BR')} em atraso`,
        action: 'Ver faturas',
      });
    }
    
    if (metrics.operations.sla_compliance < 95) {
      alerts.push({
        id: 'sla',
        type: 'warning',
        title: 'SLA abaixo da meta',
        description: `Compliance em ${metrics.operations.sla_compliance}% (meta: 95%)`,
        action: 'Ver detalhes',
      });
    }
    
    if (metrics.revenue.progress < 100) {
      const remaining = metrics.revenue.target - metrics.revenue.current;
      alerts.push({
        id: 'target',
        type: 'info',
        title: 'Meta de receita',
        description: `Faltam R$ ${remaining.toLocaleString('pt-BR')} para atingir a meta`,
        action: 'Ver detalhes',
      });
    }

    return NextResponse.json({
      success: true,
      metrics,
      top_clients: topClients,
      alerts,
      period,
    });
  } catch (e: any) {
    console.error('Executive dashboard error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
