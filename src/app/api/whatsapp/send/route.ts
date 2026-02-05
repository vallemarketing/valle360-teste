import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface WhatsAppMessage {
  phone: string;
  message: string;
  userId?: string;
  conversationId?: string;
  conversationType?: 'group' | 'direct';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: WhatsAppMessage = await request.json();
    const { phone, message, userId, conversationId, conversationType } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Telefone e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_enabled', true)
      .maybeSingle();

    if (!settings || !settings.api_token) {
      return NextResponse.json(
        { error: 'WhatsApp não configurado' },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    if (settings.business_hours_only) {
      const startHour = parseInt(settings.business_start_time.split(':')[0]);
      const endHour = parseInt(settings.business_end_time.split(':')[0]);

      if (currentHour < startHour || currentHour >= endHour) {
        return NextResponse.json(
          { error: 'Fora do horário comercial' },
          { status: 400 }
        );
      }
    }

    if (settings.exclude_weekends && (currentDay === 0 || currentDay === 6)) {
      return NextResponse.json(
        { error: 'Envio não permitido aos finais de semana' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const whatsappResponse = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.api_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: message,
        },
      }),
    });

    const whatsappData = await whatsappResponse.json();

    const logData: any = {
      recipient_phone: cleanPhone,
      message_sent: message,
      status: whatsappResponse.ok ? 'sent' : 'failed',
      error_message: whatsappResponse.ok ? null : JSON.stringify(whatsappData),
      whatsapp_message_id: whatsappData.messages?.[0]?.id,
    };

    if (userId) logData.recipient_user_id = userId;
    if (conversationId) logData.conversation_id = conversationId;
    if (conversationType) logData.conversation_type = conversationType;

    await supabase.from('whatsapp_logs').insert(logData);

    if (!whatsappResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem', details: whatsappData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: whatsappData.messages?.[0]?.id,
    });
  } catch (error: any) {
    console.error('Erro ao enviar WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: error.message },
      { status: 500 }
    );
  }
}
