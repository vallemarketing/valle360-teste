/**
 * Valle 360 - API de Automação de Emails
 * Envia emails automáticos via SendGrid
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { emailAutomation } from '@/lib/automations/email-automation';

export const dynamic = 'force-dynamic';

// POST - Enviar email automático
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, recipient, context, schedule } = body;

    if (!type || !recipient?.email || !recipient?.name) {
      return NextResponse.json({ 
        error: 'type, recipient.email e recipient.name são obrigatórios' 
      }, { status: 400 });
    }

    let result;

    // Tipos de email específicos
    switch (type) {
      case 'collection':
      case 'collection_reminder':
      case 'collection_urgent':
        if (!context?.value || !context?.dueDate) {
          return NextResponse.json({ 
            error: 'context.value e context.dueDate são obrigatórios para cobrança' 
          }, { status: 400 });
        }
        result = await emailAutomation.sendCollectionEmail(recipient, context);
        break;

      case 'welcome':
        if (!context?.accountManager) {
          return NextResponse.json({ 
            error: 'context.accountManager é obrigatório para boas-vindas' 
          }, { status: 400 });
        }
        result = await emailAutomation.sendWelcomeEmail(recipient, context);
        break;

      case 'nps':
        if (!context?.npsLink) {
          return NextResponse.json({ 
            error: 'context.npsLink é obrigatório para NPS' 
          }, { status: 400 });
        }
        result = await emailAutomation.sendNPSEmail(recipient, context.npsLink);
        break;

      case 'report':
        if (!context?.month || !context?.reportLink) {
          return NextResponse.json({ 
            error: 'context.month e context.reportLink são obrigatórios para relatório' 
          }, { status: 400 });
        }
        result = await emailAutomation.sendMonthlyReport(recipient, context);
        break;

      default:
        // Tipo genérico
        if (schedule) {
          const scheduledEmail = await emailAutomation.scheduleEmail(
            type,
            recipient,
            context || {},
            new Date(schedule)
          );
          return NextResponse.json({
            success: true,
            scheduled: true,
            email: scheduledEmail
          });
        }

        result = await emailAutomation.sendEmail({
          type,
          recipient,
          context: context || {},
          status: 'pending'
        });
    }

    // Registrar envio (ignorar erro se tabela não existir)
    try {
      await supabase.from('email_logs').insert({
        user_id: user.id,
        type,
        recipient_email: recipient.email,
        recipient_name: recipient.name,
        success: result.success,
        message_id: result.messageId,
        error: result.error
      });
    } catch {
      // Ignorar erro silenciosamente
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      mailtoUrl: (result as any).mailtoUrl,
      error: result.error
    });

  } catch (error: any) {
    console.error('Erro na automação de email:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar email',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Listar emails agendados
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data: emails, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', status)
      .order('scheduled_for', { ascending: true })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      emails: emails || []
    });

  } catch (error: any) {
    console.error('Erro ao listar emails:', error);
    return NextResponse.json({ 
      error: 'Erro ao listar emails',
      details: error.message 
    }, { status: 500 });
  }
}

