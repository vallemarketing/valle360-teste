import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Contract Renewal Cron Job
 * Runs daily to check for contracts nearing expiration and handle auto-renewal
 * 
 * Schedule: Daily at 8:00 AM
 * Vercel cron: 0 8 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const now = new Date();
    
    // Define notification thresholds (days before expiration)
    const THRESHOLDS = {
      FINAL_WARNING: 7,
      SECOND_WARNING: 30,
      FIRST_WARNING: 60,
      AUTO_RENEW_CHECK: 14, // Check for auto-renewal 14 days before expiration
    };

    let processed = {
      auto_renewed: 0,
      notifications_sent: 0,
      expired: 0,
      errors: 0,
    };

    // Fetch all active contracts
    const { data: contracts, error: contractsError } = await admin
      .from('contracts')
      .select(`
        id,
        client_id,
        contract_number,
        end_date,
        auto_renew,
        renewal_period_months,
        status,
        monthly_value,
        services,
        clients (
          id,
          company_name,
          nome_fantasia,
          email,
          user_id
        )
      `)
      .eq('status', 'active')
      .order('end_date', { ascending: true });

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      throw new Error(`Failed to fetch contracts: ${contractsError.message}`);
    }

    for (const contract of contracts || []) {
      try {
        const endDate = new Date((contract as any).end_date);
        const daysUntilExpiration = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const client = (contract as any).clients;
        const clientName = client?.company_name || client?.nome_fantasia || 'Cliente';

        // Skip if already expired (should be marked as expired separately)
        if (daysUntilExpiration < 0) {
          // Mark as expired
          await admin
            .from('contracts')
            .update({ 
              status: 'expired',
              updated_at: now.toISOString(),
            })
            .eq('id', (contract as any).id);
          
          processed.expired++;
          continue;
        }

        // Auto-renewal check
        if ((contract as any).auto_renew && daysUntilExpiration <= THRESHOLDS.AUTO_RENEW_CHECK) {
          const renewalMonths = (contract as any).renewal_period_months || 12;
          const newEndDate = new Date(endDate);
          newEndDate.setMonth(newEndDate.getMonth() + renewalMonths);

          // Create renewal record
          const renewalNumber = `REN-${(contract as any).contract_number}-${Date.now()}`;
          
          // Update contract with new end date
          await admin
            .from('contracts')
            .update({
              end_date: newEndDate.toISOString(),
              renewal_count: ((contract as any).renewal_count || 0) + 1,
              last_renewal_date: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', (contract as any).id);

          // Log the renewal
          await admin
            .from('contract_events')
            .insert({
              contract_id: (contract as any).id,
              event_type: 'auto_renewed',
              description: `Contrato renovado automaticamente por ${renewalMonths} meses`,
              new_end_date: newEndDate.toISOString(),
              created_at: now.toISOString(),
            });

          // Create invoices for the renewal period
          const monthlyValue = Number((contract as any).monthly_value || 0);
          if (monthlyValue > 0) {
            for (let i = 0; i < renewalMonths; i++) {
              const invoiceDate = new Date(endDate);
              invoiceDate.setMonth(invoiceDate.getMonth() + i);
              
              const dueDate = new Date(invoiceDate);
              dueDate.setDate(10); // Due on the 10th

              await admin
                .from('invoices')
                .insert({
                  client_id: (contract as any).client_id,
                  contract_id: (contract as any).id,
                  invoice_number: `INV-${(contract as any).contract_number}-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`,
                  amount: monthlyValue,
                  due_date: dueDate.toISOString(),
                  status: 'pending',
                  description: `Mensalidade - ${invoiceDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
                  created_at: now.toISOString(),
                });
            }
          }

          // Send notification about auto-renewal
          await admin
            .from('notifications')
            .insert({
              type: 'contract_auto_renewed',
              title: 'Contrato Renovado Automaticamente',
              message: `O contrato de ${clientName} foi renovado por mais ${renewalMonths} meses`,
              data: {
                contract_id: (contract as any).id,
                client_id: (contract as any).client_id,
                new_end_date: newEndDate.toISOString(),
              },
              read: false,
              created_at: now.toISOString(),
            });

          // TODO: Send email notification to client
          
          processed.auto_renewed++;
          continue;
        }

        // Send warning notifications for non-auto-renew contracts
        let warningType: string | null = null;
        
        if (daysUntilExpiration === THRESHOLDS.FINAL_WARNING) {
          warningType = 'final_warning';
        } else if (daysUntilExpiration === THRESHOLDS.SECOND_WARNING) {
          warningType = 'second_warning';
        } else if (daysUntilExpiration === THRESHOLDS.FIRST_WARNING) {
          warningType = 'first_warning';
        }

        if (warningType) {
          // Check if notification was already sent
          const { data: existingNotification } = await admin
            .from('notifications')
            .select('id')
            .eq('data->contract_id', (contract as any).id)
            .eq('data->warning_type', warningType)
            .maybeSingle();

          if (!existingNotification) {
            const messages: Record<string, string> = {
              first_warning: `O contrato de ${clientName} expira em ${THRESHOLDS.FIRST_WARNING} dias`,
              second_warning: `O contrato de ${clientName} expira em ${THRESHOLDS.SECOND_WARNING} dias`,
              final_warning: `URGENTE: O contrato de ${clientName} expira em ${THRESHOLDS.FINAL_WARNING} dias!`,
            };

            await admin
              .from('notifications')
              .insert({
                type: 'contract_expiring',
                title: 'Contrato Próximo do Vencimento',
                message: messages[warningType],
                data: {
                  contract_id: (contract as any).id,
                  client_id: (contract as any).client_id,
                  warning_type: warningType,
                  days_until_expiration: daysUntilExpiration,
                },
                read: false,
                created_at: now.toISOString(),
              });

            // Create task for commercial team
            if (warningType === 'first_warning') {
              await admin
                .from('kanban_tasks')
                .insert({
                  client_id: (contract as any).client_id,
                  title: `Renovação de Contrato - ${clientName}`,
                  description: `O contrato expira em ${daysUntilExpiration} dias. Entrar em contato para negociar renovação.`,
                  status: 'backlog',
                  priority: 'high',
                  area: 'commercial',
                  due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                  tags: ['renovação', 'contrato', 'comercial'],
                  metadata: {
                    contract_id: (contract as any).id,
                    expiration_date: (contract as any).end_date,
                  },
                  created_at: now.toISOString(),
                });
            }

            processed.notifications_sent++;
          }
        }

      } catch (e) {
        console.error(`Error processing contract ${(contract as any).id}:`, e);
        processed.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      timestamp: now.toISOString(),
    });

  } catch (e: any) {
    console.error('Contract renewal cron error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
