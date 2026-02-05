import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron: Generate Recurring Invoices
 * Run: Daily at 00:05 UTC
 * Vercel Cron: 5 0 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow in development or if no secret is set
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = new Date();
    const dayOfMonth = today.getDate();

    console.log(`[CRON] Running recurring invoices for day ${dayOfMonth}`);

    // Get all active recurring invoice schedules for today
    const { data: schedules, error: scheduleError } = await supabase
      .from('recurring_invoice_schedules')
      .select('*, contracts(client_id, client_company, services, status)')
      .eq('is_active', true)
      .eq('day_of_month', dayOfMonth)
      .lte('next_run', today.toISOString());

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      console.log('[CRON] No recurring invoices to generate today');
      return NextResponse.json({ message: 'No invoices to generate', count: 0 });
    }

    let generated = 0;
    let failed = 0;

    for (const schedule of schedules) {
      try {
        // Skip if contract is not active
        if (schedule.contracts?.status !== 'active') {
          await supabase
            .from('recurring_invoice_schedules')
            .update({ is_active: false })
            .eq('id', schedule.id);
          continue;
        }

        // Check if past end date
        if (schedule.end_date && new Date(schedule.end_date) < today) {
          await supabase
            .from('recurring_invoice_schedules')
            .update({ is_active: false })
            .eq('id', schedule.id);
          continue;
        }

        // Generate invoice
        const dueDate = new Date(today);
        dueDate.setDate(schedule.day_of_month);
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            contract_id: schedule.contract_id,
            client_id: schedule.client_id,
            amount: schedule.amount,
            due_date: dueDate.toISOString(),
            status: 'pending',
            description: `Mensalidade - ${schedule.contracts?.services?.[0]?.name || 'Serviços contratados'}`,
            reference_month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
            auto_generated: true,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`Failed to create invoice for schedule ${schedule.id}:`, invoiceError);
          failed++;
          continue;
        }

        // Update next run date
        const nextRun = new Date(dueDate);
        nextRun.setMonth(nextRun.getMonth() + 1);

        await supabase
          .from('recurring_invoice_schedules')
          .update({
            last_run: new Date().toISOString(),
            next_run: nextRun.toISOString(),
          })
          .eq('id', schedule.id);

        // Create notification (best-effort)
        try {
          await supabase.from('notifications').insert({
            user_id: schedule.client_id, // Notify client
            type: 'invoice_generated',
            title: 'Nova fatura disponível',
            message: `Sua fatura de R$ ${schedule.amount.toLocaleString('pt-BR')} vence em ${dueDate.toLocaleDateString('pt-BR')}`,
            link: '/cliente/financeiro',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch {
          // Ignore notification errors
        }

        console.log(`[INVOICE] Created ${invoice.id} for client ${schedule.client_id}`);
        generated++;
      } catch (err) {
        console.error(`Error processing schedule ${schedule.id}:`, err);
        failed++;
      }
    }

    // Log cron execution (best-effort)
    try {
      await supabase.from('cron_logs').insert({
        job_name: 'recurring_invoices',
        run_at: new Date().toISOString(),
        status: failed === 0 ? 'success' : 'partial',
        result: { generated, failed, total: schedules.length },
      });
    } catch {
      // Ignore logging errors
    }

    console.log(`[CRON] Completed: ${generated} invoices generated, ${failed} failed`);

    return NextResponse.json({
      success: true,
      generated,
      failed,
      total: schedules.length,
    });
  } catch (error: any) {
    console.error('[CRON] Recurring invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    );
  }
}
