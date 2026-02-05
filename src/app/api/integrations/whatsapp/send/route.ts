import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createWhatsAppClient } from '@/lib/integrations/whatsapp/cloud';

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

    // Buscar configuração da integração
    const { data: config, error: configError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', 'whatsapp')
      .single();

    if (configError || !config || config.status !== 'connected') {
      return NextResponse.json({ 
        error: 'WhatsApp não está conectado',
        needsSetup: true 
      }, { status: 400 });
    }

    const body = await request.json();
    const { type, to, ...messageData } = body;

    if (!to) {
      return NextResponse.json({ error: 'Número de destino é obrigatório' }, { status: 400 });
    }

    const client = createWhatsAppClient({
      accessToken: config.access_token,
      phoneNumberId: config.config?.phoneNumberId
    });

    let result;
    const startTime = Date.now();

    switch (type) {
      case 'text':
        if (!messageData.text) {
          return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
        }
        result = await client.sendTextMessage(to, messageData.text, messageData.previewUrl);
        break;

      case 'image':
        if (!messageData.imageUrl) {
          return NextResponse.json({ error: 'URL da imagem é obrigatória' }, { status: 400 });
        }
        result = await client.sendImage(to, messageData.imageUrl, messageData.caption);
        break;

      case 'document':
        if (!messageData.documentUrl || !messageData.filename) {
          return NextResponse.json({ error: 'URL e nome do documento são obrigatórios' }, { status: 400 });
        }
        result = await client.sendDocument(to, messageData.documentUrl, messageData.filename, messageData.caption);
        break;

      case 'template':
        if (!messageData.templateName) {
          return NextResponse.json({ error: 'Nome do template é obrigatório' }, { status: 400 });
        }
        result = await client.sendTemplate(
          to, 
          messageData.templateName, 
          messageData.languageCode || 'pt_BR',
          messageData.components
        );
        break;

      case 'buttons':
        if (!messageData.body || !messageData.buttons) {
          return NextResponse.json({ error: 'Corpo e botões são obrigatórios' }, { status: 400 });
        }
        result = await client.sendInteractiveButtons(
          to,
          messageData.body,
          messageData.buttons,
          messageData.header,
          messageData.footer
        );
        break;

      case 'list':
        if (!messageData.body || !messageData.buttonText || !messageData.sections) {
          return NextResponse.json({ error: 'Corpo, texto do botão e seções são obrigatórios' }, { status: 400 });
        }
        result = await client.sendInteractiveList(
          to,
          messageData.body,
          messageData.buttonText,
          messageData.sections,
          messageData.header,
          messageData.footer
        );
        break;

      default:
        return NextResponse.json({ error: 'Tipo de mensagem inválido' }, { status: 400 });
    }

    const duration = Date.now() - startTime;

    // Registrar log
    await supabase.from('integration_logs').insert({
      integration_id: 'whatsapp',
      action: `send_${type}`,
      status: 'success',
      request_data: { to, type },
      response_data: { messageId: result.messages?.[0]?.id },
      duration_ms: duration
    });

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      to: result.contacts?.[0]?.wa_id
    });

  } catch (error: any) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar mensagem',
      details: error.message 
    }, { status: 500 });
  }
}

// Endpoint para marcar mensagem como lida
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('integration_id', 'whatsapp')
      .single();

    if (!config || config.status !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp não está conectado' }, { status: 400 });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'ID da mensagem é obrigatório' }, { status: 400 });
    }

    const client = createWhatsAppClient({
      accessToken: config.access_token,
      phoneNumberId: config.config?.phoneNumberId
    });

    await client.markAsRead(messageId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao marcar como lida:', error);
    return NextResponse.json({ 
      error: 'Erro ao marcar como lida',
      details: error.message 
    }, { status: 500 });
  }
}






