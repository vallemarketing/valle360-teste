import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST: Sincronizar contatos do Instagram
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { syncType } = await request.json(); // 'followers', 'dms', 'comments'

    // Buscar client_id e tokens
    const { data: client } = await supabase
      .from('clients')
      .select('id, instagram_access_token, instagram_user_id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    if (!client.instagram_access_token) {
      return NextResponse.json({ 
        error: 'Instagram não conectado. Por favor, conecte sua conta primeiro.' 
      }, { status: 400 });
    }

    // Criar log de sync
    const { data: syncLog, error: logError } = await supabase
      .from('instagram_sync_logs')
      .insert({
        client_id: client.id,
        sync_type: syncType,
        status: 'processing'
      })
      .select()
      .single();

    if (logError) throw logError;

    // Sincronizar baseado no tipo
    let itemsSynced = 0;
    let errorMessage = null;

    try {
      switch (syncType) {
        case 'dms':
          itemsSynced = await syncDirectMessages(
            supabase, 
            client.id, 
            client.instagram_access_token,
            client.instagram_user_id
          );
          break;
        case 'comments':
          itemsSynced = await syncCommenters(
            supabase, 
            client.id, 
            client.instagram_access_token,
            client.instagram_user_id
          );
          break;
        case 'mentions':
          itemsSynced = await syncMentions(
            supabase, 
            client.id, 
            client.instagram_access_token,
            client.instagram_user_id
          );
          break;
        default:
          throw new Error('Tipo de sincronização inválido');
      }
    } catch (syncError: any) {
      errorMessage = syncError.message;
    }

    // Atualizar log de sync
    await supabase
      .from('instagram_sync_logs')
      .update({
        status: errorMessage ? 'failed' : 'completed',
        items_synced: itemsSynced,
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncLog.id);

    if (errorMessage) {
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        itemsSynced 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      itemsSynced,
      message: `${itemsSynced} contatos sincronizados com sucesso!`
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar Instagram:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Sincronizar DMs
async function syncDirectMessages(
  supabase: any, 
  clientId: string, 
  accessToken: string,
  instagramUserId: string
): Promise<number> {
  // Buscar conversas do Instagram
  const conversationsUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/conversations?platform=instagram&fields=participants,updated_time&access_token=${accessToken}`;
  
  const response = await fetch(conversationsUrl);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao buscar conversas');
  }

  const data = await response.json();
  const conversations = data.data || [];
  let synced = 0;

  for (const conv of conversations) {
    // Buscar participantes que não são o próprio usuário
    const otherParticipants = conv.participants?.data?.filter(
      (p: any) => p.id !== instagramUserId
    ) || [];

    for (const participant of otherParticipants) {
      // Buscar mais detalhes do usuário
      const userUrl = `https://graph.facebook.com/v18.0/${participant.id}?fields=name,username,profile_pic&access_token=${accessToken}`;
      
      try {
        const userResponse = await fetch(userUrl);
        const userData = await userResponse.json();

        // Upsert contato
        const { error } = await supabase
          .from('client_contacts')
          .upsert({
            client_id: clientId,
            instagram_id: participant.id,
            instagram_handle: userData.username || null,
            name: userData.name || userData.username || 'Instagram User',
            profile_picture_url: userData.profile_pic || null,
            source: 'instagram_dm',
            last_interaction_at: conv.updated_time,
            category: 'lead'
          }, {
            onConflict: 'client_id,instagram_id'
          });

        if (!error) synced++;
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    }
  }

  return synced;
}

// Sincronizar comentadores
async function syncCommenters(
  supabase: any, 
  clientId: string, 
  accessToken: string,
  instagramUserId: string
): Promise<number> {
  // Buscar posts recentes
  const mediaUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media?fields=id,comments{from,timestamp}&limit=20&access_token=${accessToken}`;
  
  const response = await fetch(mediaUrl);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao buscar posts');
  }

  const data = await response.json();
  const posts = data.data || [];
  let synced = 0;
  const processedUsers = new Set<string>();

  for (const post of posts) {
    const comments = post.comments?.data || [];

    for (const comment of comments) {
      const from = comment.from;
      if (!from || processedUsers.has(from.id)) continue;

      processedUsers.add(from.id);

      // Upsert contato
      const { error } = await supabase
        .from('client_contacts')
        .upsert({
          client_id: clientId,
          instagram_id: from.id,
          instagram_handle: from.username || null,
          name: from.name || from.username || 'Instagram User',
          source: 'instagram_comment',
          last_interaction_at: comment.timestamp,
          category: 'lead'
        }, {
          onConflict: 'client_id,instagram_id'
        });

      if (!error) synced++;
    }
  }

  return synced;
}

// Sincronizar menções
async function syncMentions(
  supabase: any, 
  clientId: string, 
  accessToken: string,
  instagramUserId: string
): Promise<number> {
  // Buscar menções recentes
  const mentionsUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/tags?fields=id,username,timestamp,owner&access_token=${accessToken}`;
  
  const response = await fetch(mentionsUrl);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao buscar menções');
  }

  const data = await response.json();
  const mentions = data.data || [];
  let synced = 0;

  for (const mention of mentions) {
    const owner = mention.owner;
    if (!owner) continue;

    // Upsert contato
    const { error } = await supabase
      .from('client_contacts')
      .upsert({
        client_id: clientId,
        instagram_id: owner.id,
        instagram_handle: owner.username || null,
        name: owner.name || owner.username || 'Instagram User',
        source: 'instagram_mention',
        last_interaction_at: mention.timestamp,
        category: 'lead'
      }, {
        onConflict: 'client_id,instagram_id'
      });

    if (!error) synced++;
  }

  return synced;
}
