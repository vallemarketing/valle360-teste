import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhook, parseWebhookPayload, WhatsAppWebhookPayload } from '@/lib/integrations/whatsapp/cloud';

export const dynamic = 'force-dynamic';

// GET para verificação do webhook pelo Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!mode || !token || !challenge) {
    return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
  }

  // Buscar verify token configurado
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: config } = await supabase
    .from('integration_configs')
    .select('webhook_secret')
    .eq('integration_id', 'whatsapp')
    .single();

  const verifyToken = config?.webhook_secret || process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    return NextResponse.json({ error: 'Verify token não configurado' }, { status: 400 });
  }

  const result = verifyWebhook(mode, token, challenge, verifyToken);

  if (result) {
    return new NextResponse(result, { status: 200 });
  }

  return NextResponse.json({ error: 'Verificação falhou' }, { status: 403 });
}

// POST para receber mensagens e status
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WhatsAppWebhookPayload = await request.json();

    // Verificar se é um payload válido do WhatsApp
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // Processar payload
    const { messages, statuses } = parseWebhookPayload(payload);

    // Processar mensagens recebidas
    for (const message of messages) {
      await processIncomingMessage(message, supabase);
    }

    // Processar status de mensagens
    for (const status of statuses) {
      await processMessageStatus(status, supabase);
    }

    // Registrar log
    await supabase.from('integration_logs').insert({
      integration_id: 'whatsapp',
      action: 'webhook_received',
      status: 'success',
      request_data: { 
        messagesCount: messages.length, 
        statusesCount: statuses.length 
      }
    });

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Erro no webhook WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

async function processIncomingMessage(
  message: {
    from: string;
    name?: string;
    id: string;
    timestamp: Date;
    type: string;
    content: any;
  },
  supabase: any
) {
  try {
    // Buscar ou criar conversa
    let { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', message.from)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('whatsapp_conversations')
        .insert({
          phone_number: message.from,
          contact_name: message.name,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      conversation = newConv;
    }

    // Salvar mensagem
    await supabase.from('whatsapp_messages').insert({
      conversation_id: conversation?.id,
      whatsapp_message_id: message.id,
      direction: 'incoming',
      type: message.type,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      timestamp: message.timestamp.toISOString(),
      status: 'received'
    });

    // Atualizar última mensagem da conversa
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message: typeof message.content === 'string' ? message.content : '[Mídia]',
        last_message_at: message.timestamp.toISOString(),
        unread_count: supabase.raw('unread_count + 1')
      })
      .eq('id', conversation?.id);

    // TODO: Disparar notificação para o usuário responsável
    // TODO: Verificar se há automação/bot para responder

  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
}

async function processMessageStatus(
  status: {
    messageId: string;
    status: string;
    timestamp: Date;
    to: string;
    error?: string;
  },
  supabase: any
) {
  try {
    // Atualizar status da mensagem
    await supabase
      .from('whatsapp_messages')
      .update({
        status: status.status,
        status_updated_at: status.timestamp.toISOString(),
        error_message: status.error
      })
      .eq('whatsapp_message_id', status.messageId);

    // Se falhou, registrar erro
    if (status.status === 'failed' && status.error) {
      await supabase.from('integration_logs').insert({
        integration_id: 'whatsapp',
        action: 'message_failed',
        status: 'error',
        error_message: status.error,
        request_data: { messageId: status.messageId, to: status.to }
      });
    }

  } catch (error) {
    console.error('Erro ao processar status:', error);
  }
}






