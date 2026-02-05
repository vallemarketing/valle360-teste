import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Client Invoices API
 * Allows clients to view their invoices
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client ID from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('client_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.client_id) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('invoices')
      .select('*, contracts(services)')
      .eq('client_id', profile.client_id)
      .order('due_date', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('due_date', startDate).lte('due_date', endDate);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      total: invoices?.length || 0,
      pending: invoices?.filter(i => i.status === 'pending').length || 0,
      overdue: invoices?.filter(i => i.status === 'overdue').length || 0,
      paid: invoices?.filter(i => i.status === 'paid').length || 0,
      totalPending: invoices
        ?.filter(i => ['pending', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
      totalPaid: invoices
        ?.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
    };

    return NextResponse.json({
      invoices: invoices || [],
      summary,
    });
  } catch (error: any) {
    console.error('Error in client invoices API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
