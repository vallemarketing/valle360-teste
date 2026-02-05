import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

/**
 * Get approval flow configuration for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const clientId = params.clientId;

    // Verify user is authenticated and is super_admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Get config
    const { data: config, error } = await supabase
      .from('client_approval_flows')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching approval flow:', error);
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: config || null,
    });
  } catch (error: any) {
    console.error('Approval flow GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * Create or update approval flow configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const supabaseAdmin = getSupabaseAdmin();
    const clientId = params.clientId;

    // Verify user is authenticated and is super_admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await request.json();

    // Validate
    const validFlowTypes = ['head_only', 'head_admin', 'direct'];
    if (body.flow_type && !validFlowTypes.includes(body.flow_type)) {
      return NextResponse.json({ error: 'flow_type inválido' }, { status: 400 });
    }

    // Upsert config
    const { error: upsertError } = await supabaseAdmin
      .from('client_approval_flows')
      .upsert({
        client_id: clientId,
        flow_type: body.flow_type || 'head_only',
        require_client_approval: body.require_client_approval ?? true,
        auto_publish: body.auto_publish ?? false,
        notify_on_approval: body.notify_on_approval ?? true,
        notify_on_rejection: body.notify_on_rejection ?? true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id',
      });

    if (upsertError) {
      console.error('Error upserting approval flow:', upsertError);
      return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso',
    });
  } catch (error: any) {
    console.error('Approval flow POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
