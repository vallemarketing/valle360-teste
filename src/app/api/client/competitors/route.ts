import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Listar concorrentes do cliente
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar concorrentes
    const { data: competitors, error } = await supabase
      .from('client_competitors')
      .select('*')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, competitors });
  } catch (error: any) {
    console.error('Erro ao listar concorrentes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Adicionar concorrente
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { username, name, followers_count, category } = body;

  if (!username) {
    return NextResponse.json({ error: 'Username é obrigatório' }, { status: 400 });
  }

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Verificar limite de concorrentes (máximo 5)
    const { count } = await supabase
      .from('client_competitors')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('is_active', true);

    if (count && count >= 5) {
      return NextResponse.json({ 
        error: 'Limite de 5 concorrentes atingido. Remova um para adicionar outro.' 
      }, { status: 400 });
    }

    // Inserir ou reativar concorrente
    const { data: competitor, error } = await supabase
      .from('client_competitors')
      .upsert({
        client_id: client.id,
        instagram_username: username.replace('@', ''),
        display_name: name || username,
        followers_count: followers_count || 0,
        category: category || 'Geral',
        is_active: true
      }, { 
        onConflict: 'client_id,instagram_username' 
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, competitor });
  } catch (error: any) {
    console.error('Erro ao adicionar concorrente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remover concorrente
export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const competitorId = searchParams.get('id');

  if (!competitorId) {
    return NextResponse.json({ error: 'ID do concorrente é obrigatório' }, { status: 400 });
  }

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Soft delete (desativar)
    const { error } = await supabase
      .from('client_competitors')
      .update({ is_active: false })
      .eq('id', competitorId)
      .eq('client_id', client.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover concorrente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
