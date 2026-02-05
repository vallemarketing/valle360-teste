import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Buscar anotações de um post
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  if (!postId) {
    return NextResponse.json({ error: 'postId é obrigatório' }, { status: 400 });
  }

  try {
    const { data: annotations, error } = await supabase
      .from('post_annotations')
      .select(`
        *,
        user_profiles:author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Formatar resposta
    const formattedAnnotations = annotations?.map(a => ({
      id: a.id,
      x: a.x_position,
      y: a.y_position,
      text: a.text,
      author: a.user_profiles?.full_name || 'Usuário',
      authorAvatar: a.user_profiles?.avatar_url,
      createdAt: a.created_at,
      resolved: a.resolved,
      color: a.color
    })) || [];

    return NextResponse.json({ 
      success: true, 
      annotations: formattedAnnotations 
    });
  } catch (error: any) {
    console.error('Erro ao buscar anotações:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar nova anotação
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { postId, x, y, text, color } = await request.json();

    if (!postId || x === undefined || y === undefined || !text) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Criar anotação
    const { data: annotation, error } = await supabase
      .from('post_annotations')
      .insert({
        post_id: postId,
        author_id: user.id,
        x_position: x,
        y_position: y,
        text: text,
        color: color || 'red'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      annotation: {
        id: annotation.id,
        x: annotation.x_position,
        y: annotation.y_position,
        text: annotation.text,
        author: profile?.full_name || 'Usuário',
        authorAvatar: profile?.avatar_url,
        createdAt: annotation.created_at,
        resolved: annotation.resolved,
        color: annotation.color
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar anotação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Resolver ou atualizar anotação
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { annotationId, resolved, text } = await request.json();

    if (!annotationId) {
      return NextResponse.json({ error: 'annotationId é obrigatório' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (resolved !== undefined) updateData.resolved = resolved;
    if (text !== undefined) updateData.text = text;

    const { data: annotation, error } = await supabase
      .from('post_annotations')
      .update(updateData)
      .eq('id', annotationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      annotation 
    });
  } catch (error: any) {
    console.error('Erro ao atualizar anotação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remover anotação
export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const annotationId = searchParams.get('annotationId');

  if (!annotationId) {
    return NextResponse.json({ error: 'annotationId é obrigatório' }, { status: 400 });
  }

  try {
    // Verificar se o usuário é autor da anotação ou admin
    const { data: annotation, error: fetchError } = await supabase
      .from('post_annotations')
      .select('author_id')
      .eq('id', annotationId)
      .single();

    if (fetchError) throw fetchError;

    // Buscar tipo do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.user_type === 'super_admin' || profile?.user_type === 'admin';
    const isAuthor = annotation.author_id === user.id;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Sem permissão para excluir' }, { status: 403 });
    }

    const { error } = await supabase
      .from('post_annotations')
      .delete()
      .eq('id', annotationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir anotação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
