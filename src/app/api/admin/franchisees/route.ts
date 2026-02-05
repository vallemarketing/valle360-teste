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
    
    // Check if user is super admin
    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if ((profile as any)?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    // Fetch franchisees
    let franchisees: any[] = [];
    let stats = {
      total_franchisees: 0,
      active_franchisees: 0,
      total_clients: 0,
      total_revenue: 0,
      growth_percent: 0,
    };

    try {
      const { data: franchiseData, error: franchiseError } = await admin
        .from('franchisees')
        .select(`
          id,
          name,
          owner_name,
          email,
          phone,
          city,
          state,
          status,
          monthly_revenue,
          created_at,
          franchise_contracts (
            end_date
          )
        `)
        .order('created_at', { ascending: false });
      
      if (!franchiseError && franchiseData) {
        // Get client counts for each franchisee
        for (const f of franchiseData) {
          const { count } = await admin
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('franchisee_id', f.id);
          
          (f as any).clients_count = count || 0;
          (f as any).contract_end = (f as any).franchise_contracts?.[0]?.end_date || null;
        }

        franchisees = (franchiseData as any[]).map(f => ({
          id: f.id,
          name: f.name,
          owner_name: f.owner_name,
          email: f.email,
          phone: f.phone,
          city: f.city,
          state: f.state,
          status: f.status,
          clients_count: f.clients_count,
          monthly_revenue: Number(f.monthly_revenue || 0),
          contract_end: f.contract_end,
          created_at: f.created_at,
        }));

        // Calculate stats
        stats.total_franchisees = franchisees.length;
        stats.active_franchisees = franchisees.filter(f => f.status === 'active').length;
        stats.total_clients = franchisees.reduce((sum, f) => sum + f.clients_count, 0);
        stats.total_revenue = franchisees.reduce((sum, f) => sum + f.monthly_revenue, 0);
        
        // Calculate growth (compare with last month - simplified)
        stats.growth_percent = 12; // Placeholder
      }
    } catch (e) {
      console.error('Error fetching franchisees:', e);
    }

    return NextResponse.json({
      success: true,
      franchisees,
      stats,
    });
  } catch (e: any) {
    console.error('Franchisees API error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    
    // Check if user is super admin
    const { data: profile } = await admin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if ((profile as any)?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      owner_name,
      email,
      phone,
      city,
      state,
      contract_start,
      contract_end,
      monthly_fee,
      royalty_percent,
    } = body;

    // Validate required fields
    if (!name || !owner_name || !email) {
      return NextResponse.json(
        { success: false, error: 'name, owner_name e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Create franchisee
    const { data: franchisee, error: franchiseeError } = await admin
      .from('franchisees')
      .insert({
        name,
        owner_name,
        email,
        phone,
        city,
        state,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (franchiseeError) {
      throw new Error(`Failed to create franchisee: ${franchiseeError.message}`);
    }

    // Create franchise contract
    if (contract_start && contract_end) {
      await admin
        .from('franchise_contracts')
        .insert({
          franchisee_id: (franchisee as any).id,
          start_date: contract_start,
          end_date: contract_end,
          monthly_fee: monthly_fee || 0,
          royalty_percent: royalty_percent || 5,
          status: 'active',
          created_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      franchisee,
    });
  } catch (e: any) {
    console.error('Create franchisee error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
