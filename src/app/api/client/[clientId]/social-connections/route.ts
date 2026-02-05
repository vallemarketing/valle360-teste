import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Get social connections for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const clientId = params.clientId;

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role || 'client';

    // Verify permission
    if (role === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', clientId)
        .single();

      if (!client) {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
    }

    // Get connections
    const { data: connections, error: connError } = await supabase
      .from('client_social_connections')
      .select('id, platform, account_id, account_name, account_avatar, is_active, connected_at, connected_by_role, token_expires_at')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (connError) {
      console.error('Error fetching connections:', connError);
      return NextResponse.json({ error: 'Erro ao buscar conexões' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connections: connections || [],
    });
  } catch (error: any) {
    console.error('Social connections API error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
