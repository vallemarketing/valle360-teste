import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');

    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error in contracts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.client_name || !body.client_email || !body.client_company) {
      return NextResponse.json(
        { error: 'Missing required fields: client_name, client_email, client_company' },
        { status: 400 }
      );
    }

    // Create contract record
    const contractData = {
      client_name: body.client_name,
      client_email: body.client_email,
      client_company: body.client_company,
      client_cnpj: body.client_cnpj || null,
      client_address: body.client_address || null,
      client_id: body.client_id || null,
      type: body.type || 'service',
      template_used: body.template_used || 'standard',
      services: body.services || [],
      total_value: body.total_value || 0,
      payment_terms: body.payment_terms || 'Mensal, vencimento dia 10',
      duration_months: body.duration_months || 12,
      start_date: body.start_date,
      end_date: body.end_date,
      renewal_type: body.renewal_type || 'manual',
      cancellation_fee_percent: body.cancellation_fee_percent || 30,
      cancellation_notice_days: body.cancellation_notice_days || 30,
      status: 'draft',
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
    }

    // Notify legal team (create notification)
    const { data: admins } = await supabase
      .from('user_profiles')
      .select('user_id')
      .in('user_type', ['super_admin', 'admin', 'juridico']);

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin: any) => ({
        user_id: admin.user_id,
        type: 'contract_created',
        title: 'Novo contrato criado',
        message: `Contrato para ${body.client_company} aguardando revisão.`,
        link: `/admin/contratos`,
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error in contracts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
