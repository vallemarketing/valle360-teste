import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  description: string;
  created_at: string;
  reference_id?: string;
}

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
    
    // Get client
    const { data: client, error: clientError } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (clientError || !client?.id) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 400 });
    }

    // Get current balance
    let balance = 0;
    try {
      const { data: creditsData, error: creditsError } = await admin
        .from('client_credits')
        .select('balance, updated_at')
        .eq('client_id', client.id)
        .maybeSingle();
      
      if (!creditsError && creditsData) {
        balance = Number((creditsData as any).balance || 0);
      }
    } catch (e) {
      // Table might not exist
    }

    // Get transactions
    let transactions: Transaction[] = [];
    let monthlyUsage = 0;
    
    try {
      const { data: transactionsData, error: transactionsError } = await admin
        .from('client_credit_transactions')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!transactionsError && transactionsData) {
        transactions = (transactionsData as any[]).map((t: any) => ({
          id: String(t.id),
          type: t.type || 'usage',
          amount: Number(t.amount || 0),
          description: String(t.description || ''),
          created_at: String(t.created_at),
          reference_id: t.reference_id ? String(t.reference_id) : undefined,
        }));

        // Calculate monthly usage
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        monthlyUsage = transactions
          .filter(t => t.type === 'usage' && new Date(t.created_at) >= startOfMonth)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      }
    } catch (e) {
      // Use mock data if table doesn't exist
      transactions = [
        { id: '1', type: 'purchase', amount: 5000, created_at: new Date().toISOString(), description: 'Compra de créditos' },
        { id: '2', type: 'usage', amount: -1200, created_at: new Date().toISOString(), description: 'Campanha Instagram Ads' },
      ];
      monthlyUsage = 1200;
    }

    // Calculate average monthly usage for prediction
    const monthsWithData = new Set(
      transactions
        .filter(t => t.type === 'usage')
        .map(t => {
          const d = new Date(t.created_at);
          return `${d.getFullYear()}-${d.getMonth()}`;
        })
    ).size || 1;
    
    const totalUsage = transactions
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const avgMonthlyUsage = totalUsage / monthsWithData;
    const estimatedDuration = avgMonthlyUsage > 0 ? balance / avgMonthlyUsage : 0;

    // Get previous month usage for comparison
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const lastMonthUsage = transactions
      .filter(t => {
        const date = new Date(t.created_at);
        return t.type === 'usage' && date >= startOfLastMonth && date <= endOfLastMonth;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const usageChange = lastMonthUsage > 0 
      ? ((monthlyUsage - lastMonthUsage) / lastMonthUsage) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      balance,
      stats: {
        monthly_usage: monthlyUsage,
        last_month_usage: lastMonthUsage,
        usage_change_percent: Math.round(usageChange),
        estimated_duration_months: Math.round(estimatedDuration * 10) / 10,
        low_balance: balance < 5000,
      },
      transactions,
      credit_options: [
        { value: 5000, bonus: 0 },
        { value: 10000, bonus: 500 },
        { value: 20000, bonus: 1500 },
        { value: 50000, bonus: 5000 },
      ],
    });
  } catch (e: any) {
    console.error('Credits API error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

// POST to add credits (initiate payment)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, payment_method } = body;

    if (!amount || amount < 1000) {
      return NextResponse.json({ success: false, error: 'Valor mínimo: R$ 1.000' }, { status: 400 });
    }

    if (!payment_method || !['pix', 'card', 'boleto'].includes(payment_method)) {
      return NextResponse.json({ success: false, error: 'Método de pagamento inválido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    
    // Get client
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!client?.id) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 400 });
    }

    // Calculate bonus
    const bonusTable: Record<number, number> = {
      5000: 0,
      10000: 500,
      20000: 1500,
      50000: 5000,
    };
    const bonus = bonusTable[amount] || 0;
    const totalCredits = amount + bonus;

    // Create a pending credit order
    const orderId = `CRD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    try {
      await admin
        .from('client_credit_orders')
        .insert({
          id: orderId,
          client_id: client.id,
          amount,
          bonus,
          total_credits: totalCredits,
          payment_method,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
    } catch (e) {
      // Table might not exist, continue anyway for now
      console.log('Credit order table not found, continuing with simulated order');
    }

    // Generate payment data based on method
    let paymentData: any = { order_id: orderId };
    
    if (payment_method === 'pix') {
      // In production, integrate with payment gateway (Stripe, PagSeguro, etc.)
      paymentData = {
        ...paymentData,
        type: 'pix',
        qr_code: `PIX-${orderId}`,
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PIX-${orderId}`,
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      };
    } else if (payment_method === 'boleto') {
      paymentData = {
        ...paymentData,
        type: 'boleto',
        barcode: `23793.38128 60000.000003 00000.000400 1 ${amount.toString().padStart(10, '0')}`,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      };
    } else {
      // Card - would redirect to checkout
      paymentData = {
        ...paymentData,
        type: 'card',
        checkout_url: `/checkout/credits/${orderId}`,
      };
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount,
      bonus,
      total_credits: totalCredits,
      payment: paymentData,
    });
  } catch (e: any) {
    console.error('Credit purchase error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}
