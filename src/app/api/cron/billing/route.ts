import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Collection reminder schedule
const REMINDER_SCHEDULE = [
  { daysOverdue: 0, type: 'due_today', channel: 'email' },
  { daysOverdue: 3, type: 'first_reminder', channel: 'email' },
  { daysOverdue: 7, type: 'second_reminder', channel: 'email' },
  { daysOverdue: 15, type: 'urgent_reminder', channel: 'email_whatsapp' },
  { daysOverdue: 30, type: 'final_notice', channel: 'email_whatsapp' },
];

/**
 * Cron: Process Billing and Overdue Invoices
 * Run: Daily at 08:00 UTC (05:00 BRT)
 * Vercel Cron: 0 8 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('[CRON] Running billing automation');

    const results = {
      dueTodayNotified: 0,
      overdueProcessed: 0,
      reminderssentEmail: 0,
      remindersSentWhatsApp: 0,
      errors: 0,
    };

    // Get all pending invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          id,
          company_name,
          email,
          phone,
          contact_name
        ),
        contracts (
          id,
          services
        )
      `)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      console.log('[CRON] No pending invoices');
      return NextResponse.json({ message: 'No invoices to process', ...results });
    }

    for (const invoice of invoices) {
      try {
        const dueDate = new Date(invoice.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Update status to overdue if past due
        if (daysOverdue > 0 && invoice.status === 'pending') {
          await supabase
            .from('invoices')
            .update({
              status: 'overdue',
              days_overdue: daysOverdue,
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoice.id);
        }

        // Check if we should send a reminder
        const reminder = REMINDER_SCHEDULE.find(r => r.daysOverdue === daysOverdue);
        if (!reminder) continue;

        // Check if we already sent this reminder
        const { data: existingReminder } = await supabase
          .from('billing_reminders')
          .select('id')
          .eq('invoice_id', invoice.id)
          .eq('reminder_type', reminder.type)
          .single();

        if (existingReminder) continue; // Already sent

        // Send reminders
        const client = invoice.clients;
        if (!client) continue;

        // Calculate late fees if overdue
        let lateFee = 0;
        let interest = 0;
        if (daysOverdue > 0) {
          lateFee = invoice.amount * 0.02; // 2% late fee
          interest = invoice.amount * 0.01 * Math.ceil(daysOverdue / 30); // 1% per month
        }

        const totalDue = invoice.amount + lateFee + interest;

        // Email reminder
        if (reminder.channel.includes('email') && client.email) {
          await sendEmailReminder({
            to: client.email,
            clientName: client.contact_name || client.company_name,
            invoiceId: invoice.id,
            amount: invoice.amount,
            lateFee,
            interest,
            totalDue,
            dueDate: dueDate.toLocaleDateString('pt-BR'),
            daysOverdue,
            reminderType: reminder.type,
          });
          results.reminderssentEmail++;
        }

        // WhatsApp reminder (for urgent/final)
        if (reminder.channel.includes('whatsapp') && client.phone) {
          await sendWhatsAppReminder({
            phone: client.phone,
            clientName: client.contact_name || client.company_name,
            amount: totalDue,
            dueDate: dueDate.toLocaleDateString('pt-BR'),
            reminderType: reminder.type,
          });
          results.remindersSentWhatsApp++;
        }

        // Log the reminder
        await supabase.from('billing_reminders').insert({
          invoice_id: invoice.id,
          client_id: client.id,
          reminder_type: reminder.type,
          channel: reminder.channel,
          sent_at: new Date().toISOString(),
          metadata: {
            daysOverdue,
            amount: invoice.amount,
            lateFee,
            interest,
            totalDue,
          },
        });

        if (daysOverdue === 0) {
          results.dueTodayNotified++;
        } else {
          results.overdueProcessed++;
        }
      } catch (err) {
        console.error(`Error processing invoice ${invoice.id}:`, err);
        results.errors++;
      }
    }

    // Log cron execution (best-effort)
    try {
      await supabase.from('cron_logs').insert({
        job_name: 'billing_automation',
        run_at: new Date().toISOString(),
        status: results.errors === 0 ? 'success' : 'partial',
        result: results,
      });
    } catch {
      // Ignore logging errors
    }

    console.log('[CRON] Billing complete:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('[CRON] Billing error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}

// Send email reminder
async function sendEmailReminder(data: {
  to: string;
  clientName: string;
  invoiceId: string;
  amount: number;
  lateFee: number;
  interest: number;
  totalDue: number;
  dueDate: string;
  daysOverdue: number;
  reminderType: string;
}) {
  const subjects: Record<string, string> = {
    due_today: `Lembrete: Sua fatura vence hoje`,
    first_reminder: `Aviso: Fatura em atraso (${data.daysOverdue} dias)`,
    second_reminder: `Importante: Fatura pendente há ${data.daysOverdue} dias`,
    urgent_reminder: `Urgente: Regularize sua fatura em atraso`,
    final_notice: `Último aviso: Fatura pendente há ${data.daysOverdue} dias`,
  };

  const subject = subjects[data.reminderType] || 'Lembrete de fatura';

  // Send via API route or external service
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: data.to,
      subject,
      template: 'billing_reminder',
      data: {
        clientName: data.clientName,
        invoiceId: data.invoiceId,
        amount: data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        lateFee: data.lateFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        interest: data.interest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        totalDue: data.totalDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        dueDate: data.dueDate,
        daysOverdue: data.daysOverdue,
        paymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${data.invoiceId}`,
      },
    }),
  }).catch(console.error);
}

// Send WhatsApp reminder
async function sendWhatsAppReminder(data: {
  phone: string;
  clientName: string;
  amount: number;
  dueDate: string;
  reminderType: string;
}) {
  const messages: Record<string, string> = {
    urgent_reminder: `Olá ${data.clientName}! 📋\n\nSua fatura de ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com vencimento em ${data.dueDate} está pendente.\n\nPor favor, regularize para evitar encargos.\n\nDúvidas? Responda esta mensagem.`,
    final_notice: `⚠️ ${data.clientName}, último aviso!\n\nSua fatura de ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} está em atraso desde ${data.dueDate}.\n\nRegularize imediatamente para evitar suspensão dos serviços.\n\nPrecisa de ajuda? Responda aqui.`,
  };

  const message = messages[data.reminderType];
  if (!message) return;

  // Send via Evolution API or Twilio
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionKey = process.env.EVOLUTION_API_KEY;

  if (evolutionUrl && evolutionKey) {
    await fetch(`${evolutionUrl}/message/sendText/Valle360`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: data.phone.replace(/\D/g, ''),
        text: message,
      }),
    }).catch(console.error);
  }
}
