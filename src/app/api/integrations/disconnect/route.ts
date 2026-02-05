import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: isAdmin, error: isAdminError } = await supabase.rpc('is_admin');
    if (isAdminError || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });
    }

    const { integrationId } = await request.json();

    if (!integrationId) {
      return NextResponse.json({ error: 'ID da integração é obrigatório' }, { status: 400 });
    }

    // Limpar credenciais e desconectar
    const { data, error } = await supabase
      .from('integration_configs')
      .update({
        api_key: null,
        api_secret: null,
        access_token: null,
        refresh_token: null,
        webhook_secret: null,
        config: {},
        status: 'disconnected',
        error_message: null
      })
      .eq('integration_id', integrationId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desconectar integração:', error);
      return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 });
    }

    // Registrar log
    await supabase.from('integration_logs').insert({
      integration_id: integrationId,
      action: 'disconnect',
      status: 'success',
      response_data: { disconnected: true }
    });

    return NextResponse.json({
      success: true,
      message: `${data.display_name} desconectado com sucesso`,
      integration: {
        id: data.integration_id,
        name: data.display_name,
        status: data.status
      }
    });

  } catch (error: any) {
    console.error('Erro ao desconectar:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}






