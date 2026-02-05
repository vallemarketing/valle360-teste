import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Listar contatos do cliente
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category');
  const tags = searchParams.get('tags')?.split(',').filter(Boolean);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

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

    // Query base
    let query = supabase
      .from('client_contacts')
      .select('*', { count: 'exact' })
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    // Filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,instagram_handle.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    // Paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: contacts, count, error } = await query;

    if (error) throw error;

    // Buscar tags do cliente
    const { data: clientTags } = await supabase
      .from('client_contact_tags')
      .select('*')
      .eq('client_id', client.id);

    // Estatísticas rápidas
    const { data: stats } = await supabase
      .from('client_contacts')
      .select('category')
      .eq('client_id', client.id);

    const categoryStats = stats?.reduce((acc: Record<string, number>, c) => {
      acc[c.category || 'outros'] = (acc[c.category || 'outros'] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      contacts: contacts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      tags: clientTags || [],
      stats: categoryStats
    });
  } catch (error: any) {
    console.error('Erro ao buscar contatos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar contato
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, instagram_handle, tags, category, notes } = body;

    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Verificar duplicado por email ou instagram
    if (email || instagram_handle) {
      let duplicateQuery = supabase
        .from('client_contacts')
        .select('id')
        .eq('client_id', client.id);

      if (email) {
        duplicateQuery = duplicateQuery.or(`email.eq.${email}`);
      }
      if (instagram_handle) {
        duplicateQuery = duplicateQuery.or(`instagram_handle.eq.${instagram_handle}`);
      }

      const { data: existing } = await duplicateQuery.limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ 
          error: 'Contato já existe com este email ou Instagram' 
        }, { status: 409 });
      }
    }

    // Criar contato
    const { data: contact, error } = await supabase
      .from('client_contacts')
      .insert({
        client_id: client.id,
        name,
        email,
        phone,
        instagram_handle,
        tags: tags || [],
        category: category || 'lead',
        notes,
        source: 'manual'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error('Erro ao criar contato:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Atualizar contato
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Atualizar contato
    const { data: contact, error } = await supabase
      .from('client_contacts')
      .update(updateData)
      .eq('id', id)
      .eq('client_id', client.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error('Erro ao atualizar contato:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remover contato
export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
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

    const { error } = await supabase
      .from('client_contacts')
      .delete()
      .eq('id', id)
      .eq('client_id', client.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover contato:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
