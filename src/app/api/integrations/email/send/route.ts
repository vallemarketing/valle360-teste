import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createSendGridClient, EMAIL_TEMPLATES } from '@/lib/integrations/email/sendgrid';

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
      .eq('integration_id', 'sendgrid')
      .maybeSingle();

    const envApiKey = process.env.SENDGRID_API_KEY || '';
    let apiKey = (config?.api_key || envApiKey || '').trim();
    let connectedVia: 'db' | 'env' | 'mailto' = config?.status === 'connected' && !!config?.api_key ? 'db' : envApiKey ? 'env' : 'mailto';

    if (!apiKey) {
      apiKey = 'mailto';
      connectedVia = 'mailto';
    }

    const body = await request.json();
    const { type, to, ...emailData } = body;

    if (!to) {
      return NextResponse.json({ error: 'Destinatário é obrigatório' }, { status: 400 });
    }

    const client = createSendGridClient({
      apiKey,
      fromEmail: config?.config?.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@valle360.com.br',
      fromName: config?.config?.fromName || process.env.SENDGRID_FROM_NAME || 'Valle 360'
    });

    let result;
    const startTime = Date.now();

    // Usar template pré-definido ou envio customizado
    switch (type) {
      case 'welcome':
        const welcomeTemplate = EMAIL_TEMPLATES.welcome(
          emailData.name || 'Cliente',
          emailData.companyName || 'Valle 360'
        );
        result = await client.sendEmail({
          to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : { email: to },
          subject: welcomeTemplate.subject,
          html: welcomeTemplate.html
        });
        break;

      case 'notification':
        const notifTemplate = EMAIL_TEMPLATES.notification(
          emailData.title,
          emailData.message,
          emailData.actionUrl,
          emailData.actionText
        );
        result = await client.sendEmail({
          to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : { email: to },
          subject: notifTemplate.subject,
          html: notifTemplate.html
        });
        break;

      case 'meeting':
        if (!emailData.date || !emailData.time || !emailData.meetLink) {
          return NextResponse.json({ error: 'Data, hora e link da reunião são obrigatórios' }, { status: 400 });
        }
        const meetingTemplate = EMAIL_TEMPLATES.meetingScheduled(
          emailData.clientName || 'Cliente',
          emailData.date,
          emailData.time,
          emailData.meetLink,
          emailData.description
        );
        result = await client.sendEmail({
          to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : { email: to },
          subject: meetingTemplate.subject,
          html: meetingTemplate.html
        });
        break;

      case 'invoice':
        if (!emailData.invoiceNumber || !emailData.amount || !emailData.dueDate || !emailData.paymentLink) {
          return NextResponse.json({ error: 'Dados da fatura são obrigatórios' }, { status: 400 });
        }
        const invoiceTemplate = EMAIL_TEMPLATES.invoice(
          emailData.clientName || 'Cliente',
          emailData.invoiceNumber,
          emailData.amount,
          emailData.dueDate,
          emailData.paymentLink
        );
        result = await client.sendEmail({
          to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : { email: to },
          subject: invoiceTemplate.subject,
          html: invoiceTemplate.html
        });
        break;

      case 'custom':
        // Email customizado
        if (!emailData.subject) {
          return NextResponse.json({ error: 'Assunto é obrigatório' }, { status: 400 });
        }
        if (!emailData.html && !emailData.text) {
          return NextResponse.json({ error: 'Conteúdo (html ou text) é obrigatório' }, { status: 400 });
        }
        result = await client.sendEmail({
          to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : { email: to },
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          templateId: emailData.templateId,
          dynamicTemplateData: emailData.templateData,
          cc: emailData.cc?.map((e: string) => ({ email: e })),
          bcc: emailData.bcc?.map((e: string) => ({ email: e })),
          replyTo: emailData.replyTo ? { email: emailData.replyTo } : undefined,
          categories: emailData.categories
        });
        break;

      case 'bulk':
        // Envio em massa
        if (!emailData.recipients || !Array.isArray(emailData.recipients)) {
          return NextResponse.json({ error: 'Lista de destinatários é obrigatória' }, { status: 400 });
        }
        result = await client.sendBulkEmail(emailData.recipients, {
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          templateId: emailData.templateId
        });
        break;

      default:
        return NextResponse.json({ error: 'Tipo de email inválido' }, { status: 400 });
    }

    const duration = Date.now() - startTime;

    // Registrar log
    const errorMessage = 'error' in result ? result.error : ('errors' in result ? result.errors.join(', ') : undefined);
    const isSuccess = typeof result.success === 'boolean' ? result.success : (result as any).failed === 0;
    
    await supabase.from('integration_logs').insert({
      integration_id: 'sendgrid',
      action: `send_${type}`,
      status: isSuccess ? 'success' : 'error',
      request_data: { type, to: Array.isArray(to) ? to.length : 1 },
      error_message: errorMessage,
      duration_ms: duration,
      response_data: { connectedVia }
    });

    if (!isSuccess) {
      return NextResponse.json({ 
        error: 'Erro ao preparar email',
        details: errorMessage 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email pronto via mailto',
      mailtoUrl: (result as any).mailtoUrl,
      ...(type === 'bulk' && { 
        sent: (result as any).success,
        failed: (result as any).failed 
      })
    });

  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar email',
      details: error.message 
    }, { status: 500 });
  }
}

// GET para listar templates disponíveis
export async function GET(request: NextRequest) {
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
      .eq('integration_id', 'sendgrid')
      .maybeSingle();

    const envApiKey = process.env.SENDGRID_API_KEY || '';
    const apiKey = (config?.api_key || envApiKey || '').trim();

    const templates = apiKey
      ? await createSendGridClient({
          apiKey,
          fromEmail: config?.config?.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@valle360.com.br'
        }).listTemplates()
      : { templates: [] };

    // Adicionar templates pré-definidos
    const predefinedTemplates = [
      { id: 'welcome', name: 'Boas-vindas', type: 'predefined' },
      { id: 'notification', name: 'Notificação', type: 'predefined' },
      { id: 'meeting', name: 'Reunião Agendada', type: 'predefined' },
      { id: 'invoice', name: 'Fatura', type: 'predefined' }
    ];

    return NextResponse.json({
      success: true,
      predefined: predefinedTemplates,
      sendgrid: templates.templates || []
    });

  } catch (error: any) {
    console.error('Erro ao listar templates:', error);
    return NextResponse.json({ 
      error: 'Erro ao listar templates',
      details: error.message 
    }, { status: 500 });
  }
}

