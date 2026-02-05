import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface Referral {
  id: string;
  referred_client_id: string | null;
  referred_email: string;
  referred_name: string | null;
  status: 'pending' | 'active' | 'paid';
  created_at: string;
  earnings: number;
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
      .select('id, company_name, nome_fantasia, referral_code')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (clientError || !client?.id) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 400 });
    }

    // Generate referral code if not exists
    let referralCode = (client as any).referral_code;
    if (!referralCode) {
      const companyName = (client as any).company_name || (client as any).nome_fantasia || 'CLIENT';
      referralCode = companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      await admin
        .from('clients')
        .update({ referral_code: referralCode })
        .eq('id', client.id);
    }

    // Try to fetch referrals from client_referrals table
    let referrals: Referral[] = [];
    let totalEarnings = 0;
    let activeReferrals = 0;
    
    try {
      const { data: referralData, error: referralError } = await admin
        .from('client_referrals')
        .select('*')
        .eq('referrer_client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (!referralError && referralData) {
        referrals = (referralData as any[]).map((r: any) => ({
          id: String(r.id),
          referred_client_id: r.referred_client_id ? String(r.referred_client_id) : null,
          referred_email: String(r.referred_email || ''),
          referred_name: r.referred_name ? String(r.referred_name) : null,
          status: r.status || 'pending',
          created_at: String(r.created_at),
          earnings: Number(r.earnings || 500),
        }));
        
        activeReferrals = referrals.filter(r => r.status === 'active' || r.status === 'paid').length;
        totalEarnings = referrals
          .filter(r => r.status !== 'pending')
          .reduce((sum, r) => sum + r.earnings, 0);
      }
    } catch (e) {
      // Table might not exist yet
      console.log('client_referrals table not found, using empty data');
    }

    // Try to fetch available benefits
    let availableBenefits: any[] = [];
    try {
      const { data: benefitsData, error: benefitsError } = await admin
        .from('client_benefits')
        .select('*')
        .eq('active', true)
        .order('credits_required', { ascending: true });
      
      if (!benefitsError && benefitsData) {
        availableBenefits = (benefitsData as any[]).map((b: any) => ({
          id: String(b.id),
          name: String(b.name || ''),
          description: String(b.description || ''),
          credits_required: Number(b.credits_required || 0),
          category: String(b.category || 'general'),
          available: true,
        }));
      }
    } catch (e) {
      // Use default benefits if table doesn't exist
      availableBenefits = [
        { id: '1', name: 'Consultoria Gratuita', description: '1 hora de consultoria estratégica', credits_required: 1000, category: 'service', available: true },
        { id: '2', name: 'Design Gráfico Extra', description: '2 artes adicionais no mês', credits_required: 500, category: 'service', available: true },
        { id: '3', name: 'Upgrade de Plano', description: '1 mês de plano premium', credits_required: 2500, category: 'premium', available: false },
      ];
    }

    // Get gamification level/tier
    let level = 'Bronze';
    let discount = 0;
    try {
      const { data: scoreData } = await admin
        .from('client_gamification_scores')
        .select('total_points, level')
        .eq('client_id', client.id)
        .maybeSingle();
      
      if (scoreData?.total_points) {
        const points = Number(scoreData.total_points);
        if (points > 10000) { level = 'VIP'; discount = 20; }
        else if (points > 5000) { level = 'Diamante'; discount = 15; }
        else if (points > 2000) { level = 'Ouro'; discount = 10; }
        else if (points > 500) { level = 'Prata'; discount = 5; }
        else { level = 'Bronze'; discount = 0; }
      }
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
      referral_url: `https://valle360.com/ref/${referralCode}`,
      referrals,
      stats: {
        total_referrals: referrals.length,
        active_referrals: activeReferrals,
        total_earnings: totalEarnings,
      },
      level: {
        name: level,
        discount,
      },
      available_benefits: availableBenefits,
    });
  } catch (e: any) {
    console.error('Benefits API error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

// POST to redeem a benefit
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
    const { benefit_id } = body;

    if (!benefit_id) {
      return NextResponse.json({ success: false, error: 'benefit_id é obrigatório' }, { status: 400 });
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

    // Get benefit details
    const { data: benefit, error: benefitError } = await admin
      .from('client_benefits')
      .select('*')
      .eq('id', benefit_id)
      .eq('active', true)
      .maybeSingle();
    
    if (benefitError || !benefit) {
      return NextResponse.json({ success: false, error: 'Benefício não encontrado' }, { status: 404 });
    }

    const creditsRequired = Number((benefit as any).credits_required || 0);

    // Check client credits
    const { data: creditsData } = await admin
      .from('client_credits')
      .select('balance')
      .eq('client_id', client.id)
      .maybeSingle();
    
    const currentBalance = Number((creditsData as any)?.balance || 0);
    
    if (currentBalance < creditsRequired) {
      return NextResponse.json({ 
        success: false, 
        error: 'Créditos insuficientes',
        required: creditsRequired,
        available: currentBalance,
      }, { status: 400 });
    }

    // Deduct credits and record redemption
    await admin
      .from('client_credits')
      .update({ 
        balance: currentBalance - creditsRequired,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', client.id);

    // Record benefit redemption
    await admin
      .from('client_benefit_redemptions')
      .insert({
        client_id: client.id,
        benefit_id,
        credits_used: creditsRequired,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Benefício resgatado com sucesso!',
      new_balance: currentBalance - creditsRequired,
    });
  } catch (e: any) {
    console.error('Benefit redemption error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}
