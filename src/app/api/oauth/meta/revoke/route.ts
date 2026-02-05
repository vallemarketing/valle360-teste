import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

/**
 * Meta OAuth Revoke Endpoint
 * Disconnects a social account
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const supabaseAdmin = getSupabaseAdmin();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, reason } = body;

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId é obrigatório' }, { status: 400 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role || 'client';

    // Get the connection details before deleting
    const { data: connection, error: connError } = await supabaseAdmin
      .from('client_social_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

    // Verify permission (client can only disconnect own, super_admin can disconnect any)
    if (role === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', connection.client_id)
        .single();

      if (!client) {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
    }

    // Mark as inactive (soft delete) instead of hard delete
    const { error: updateError } = await supabaseAdmin
      .from('client_social_connections')
      .update({
        is_active: false,
        access_token: 'REVOKED',
        refresh_token: null,
      })
      .eq('id', connectionId);

    if (updateError) {
      console.error('Error revoking connection:', updateError);
      return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 });
    }

    // Log to audit
    await supabaseAdmin.from('social_connection_audit').insert({
      client_id: connection.client_id,
      platform: connection.platform,
      account_id: connection.account_id,
      account_name: connection.account_name,
      action: 'disconnected',
      performed_by: user.id,
      performed_by_role: role,
      reason: reason || 'Desconectado pelo usuário',
    });

    return NextResponse.json({
      success: true,
      message: 'Conta desconectada com sucesso',
    });
  } catch (error: any) {
    console.error('Meta OAuth revoke error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao desconectar conta' },
      { status: 500 }
    );
  }
}
