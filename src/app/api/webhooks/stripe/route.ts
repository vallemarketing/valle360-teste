import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { constructWebhookEvent } from '@/lib/integrations/stripe/client';
import Stripe from 'stripe';
import { emitEvent, markEventError, markEventProcessed } from '@/lib/admin/eventBus';
import { handleEvent } from '@/lib/admin/eventHandlers';
import { notifyAreaUsers } from '@/lib/admin/notifyArea';
import { createSendGridClient, EMAIL_TEMPLATES } from '@/lib/integrations/email/sendgrid';

export const dynamic = 'force-dynamic';

// Desabilitar body parsing do Next.js para webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Criar cliente Supabase com service role para operações de backend
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase não configurado');
      return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar webhook secret
    const { data: config } = await supabase
      .from('integration_configs')
      .select('webhook_secret')
      .eq('integration_id', 'stripe')
      .single();

    const webhookSecret = config?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret não configurado');
      return NextResponse.json({ error: 'Webhook não configurado' }, { status: 400 });
    }

    // Obter body raw e signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature ausente' }, { status: 400 });
    }

    // Verificar e construir evento
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Erro na verificação do webhook:', err.message);
      return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 });
    }

    // Processar evento
    const result = await processStripeEvent(event, supabase);

    // Registrar log
    await supabase.from('integration_logs').insert({
      integration_id: 'stripe',
      action: `webhook_${event.type}`,
      status: result.success ? 'success' : 'error',
      request_data: { eventId: event.id, eventType: event.type },
      response_data: result,
      error_message: result.error
    });

    return NextResponse.json({ received: true, processed: result.success });

  } catch (error: any) {
    console.error('Erro no webhook Stripe:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error.message 
    }, { status: 500 });
  }
}

async function processStripeEvent(
  event: Stripe.Event, 
  supabase: any
): Promise<{ success: boolean; action?: string; error?: string }> {
  
  try {
    switch (event.type) {
      // ========== CHECKOUT ==========
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Atualizar status do pagamento/assinatura
        if (session.mode === 'subscription') {
          // Criar registro de assinatura
          await supabase.from('subscriptions').upsert({
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            user_id: session.metadata?.userId,
            status: 'active',
            created_at: new Date().toISOString()
          });
        } else {
          // Registrar pagamento único
          await supabase.from('payments').insert({
            stripe_payment_intent_id: session.payment_intent,
            stripe_customer_id: session.customer,
            user_id: session.metadata?.userId,
            amount: session.amount_total,
            currency: session.currency,
            status: 'completed',
            created_at: new Date().toISOString()
          });
        }
        
        return { success: true, action: 'checkout_completed' };
      }

      // ========== PAGAMENTOS ==========
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase.from('payments').upsert({
          stripe_payment_intent_id: paymentIntent.id,
          stripe_customer_id: paymentIntent.customer,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          updated_at: new Date().toISOString()
        }, { onConflict: 'stripe_payment_intent_id' });
        
        return { success: true, action: 'payment_succeeded' };
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase.from('payments').upsert({
          stripe_payment_intent_id: paymentIntent.id,
          status: 'failed',
          error_message: paymentIntent.last_payment_error?.message,
          updated_at: new Date().toISOString()
        }, { onConflict: 'stripe_payment_intent_id' });
        
        return { success: true, action: 'payment_failed' };
      }

      // ========== ASSINATURAS ==========
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase.from('subscriptions').upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString()
        }, { onConflict: 'stripe_subscription_id' });
        
        return { success: true, action: 'subscription_created' };
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase.from('subscriptions').update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subscription.id);
        
        return { success: true, action: 'subscription_updated' };
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase.from('subscriptions').update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', subscription.id);
        
        return { success: true, action: 'subscription_canceled' };
      }

      // ========== FATURAS ==========
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        const expandedCustomerEmail =
          typeof invoice.customer !== 'string' &&
          invoice.customer &&
          'email' in invoice.customer &&
          typeof invoice.customer.email === 'string'
            ? invoice.customer.email
            : undefined;

        const customerEmail = invoice.customer_email ?? expandedCustomerEmail ?? undefined;

        // Tentar vincular ao client_id do sistema
        let clientId: string | null = null;
        if (stripeCustomerId) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('stripe_customer_id', stripeCustomerId)
            .limit(1)
            .single();
          clientId = client?.id || null;
        }
        if (!clientId && customerEmail) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .or(`email.eq.${customerEmail},contact_email.eq.${customerEmail}`)
            .limit(1)
            .single();
          clientId = client?.id || null;
        }

        if (!clientId) {
          return { success: false, error: 'Não foi possível identificar client_id para invoice.paid' };
        }

        const stripeIssueDate = new Date((invoice.created || Date.now() / 1000) * 1000).toISOString().slice(0, 10);
        const stripeDueDate = new Date((invoice.due_date || invoice.created || Date.now() / 1000) * 1000).toISOString().slice(0, 10);
        const amountMoney = Math.round((invoice.amount_due || invoice.amount_paid || 0)) / 100;

        // Evitar duplicar fatura interna: tentar casar por client_id + due_date + amount quando stripe_invoice_id ainda não existe
        let dbInvoice: any = null;
        const { data: existingByStripe } = await supabase
          .from('invoices')
          .select('id, client_id, contract_id, invoice_number, amount, due_date, status')
          .eq('stripe_invoice_id', invoice.id)
          .limit(1)
          .maybeSingle();
        dbInvoice = existingByStripe || null;

        if (!dbInvoice) {
          const { data: matchInternal } = await supabase
            .from('invoices')
            .select('id, client_id, contract_id, invoice_number, amount, due_date, status')
            .eq('client_id', clientId)
            .in('status', ['pending', 'payment_failed'])
            .eq('due_date', stripeDueDate)
            .eq('amount', amountMoney)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          dbInvoice = matchInternal || null;
        }

        if (dbInvoice?.id) {
          const { data: updatedInvoice, error: updErr } = await supabase
            .from('invoices')
            .update({
          stripe_invoice_id: invoice.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              payment_method: (invoice.collection_method as string) || null,
              amount_paid: invoice.amount_paid || 0, // centavos
          currency: invoice.currency,
          status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbInvoice.id)
            .select('id, client_id, contract_id, invoice_number')
            .single();
          if (updErr) throw updErr;
          dbInvoice = updatedInvoice;
        } else {
          const { data: insertedInvoice, error: insErr } = await supabase
            .from('invoices')
            .insert({
              client_id: clientId,
              stripe_invoice_id: invoice.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              invoice_number: invoice.number || `STRIPE-${invoice.id}`,
              amount: amountMoney,
              amount_paid: invoice.amount_paid || 0,
              currency: invoice.currency,
              issue_date: stripeIssueDate,
              due_date: stripeDueDate,
              status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id, client_id, contract_id, invoice_number')
            .single();
          if (insErr) throw insErr;
          dbInvoice = insertedInvoice;
        }

        const emitted = await emitEvent(
          {
            eventType: 'invoice.paid',
            entityType: 'invoice',
            entityId: dbInvoice?.id,
            actorUserId: null,
            payload: {
              stripe_event_id: event.id,
              stripe_invoice_id: invoice.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              client_id: dbInvoice?.client_id || clientId,
              contract_id: dbInvoice?.contract_id || null,
              invoice_number: dbInvoice?.invoice_number || invoice.number,
              amount: amountMoney,
              amount_paid: invoice.amount_paid || 0,
              currency: invoice.currency,
              due_date: stripeDueDate,
              customer_email: customerEmail || null,
            },
          },
          supabase
        );

        // Processar imediatamente (best-effort) para manter áreas sincronizadas sem depender de cron.
        try {
          const r = await handleEvent(emitted as any);
          if (r.ok) await markEventProcessed(emitted.id, supabase);
          else await markEventError(emitted.id, r.error, supabase);
        } catch (e: any) {
          await markEventError(emitted.id, e?.message || 'Erro ao processar evento invoice.paid', supabase);
        }
        
        return { success: true, action: 'invoice_paid' };
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        const expandedCustomerEmail =
          typeof invoice.customer !== 'string' &&
          invoice.customer &&
          'email' in invoice.customer &&
          typeof invoice.customer.email === 'string'
            ? invoice.customer.email
            : undefined;

        const customerEmail = invoice.customer_email ?? expandedCustomerEmail ?? undefined;

        // Tentar vincular ao client_id do sistema
        let clientId: string | null = null;
        if (stripeCustomerId) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('stripe_customer_id', stripeCustomerId)
            .limit(1)
            .single();
          clientId = client?.id || null;
        }
        if (!clientId && customerEmail) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .or(`email.eq.${customerEmail},contact_email.eq.${customerEmail}`)
            .limit(1)
            .single();
          clientId = client?.id || null;
        }

        if (!clientId) {
          return { success: false, error: 'Não foi possível identificar client_id para invoice.payment_failed' };
        }

        const stripeDueDate = new Date((invoice.due_date || invoice.created || Date.now() / 1000) * 1000).toISOString().slice(0, 10);
        const amountMoney = Math.round((invoice.amount_due || invoice.amount_paid || 0)) / 100;

        let dbInvoice: any = null;
        const { data: existingByStripe } = await supabase
          .from('invoices')
          .select('id, client_id, contract_id, invoice_number, amount, due_date, status')
          .eq('stripe_invoice_id', invoice.id)
          .limit(1)
          .maybeSingle();
        dbInvoice = existingByStripe || null;

        if (!dbInvoice) {
          const { data: matchInternal } = await supabase
            .from('invoices')
            .select('id, client_id, contract_id, invoice_number, amount, due_date, status')
            .eq('client_id', clientId)
            .in('status', ['pending', 'payment_failed'])
            .eq('due_date', stripeDueDate)
            .eq('amount', amountMoney)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          dbInvoice = matchInternal || null;
        }
        
        if (dbInvoice?.id) {
          const { data: updatedInvoice, error: updErr } = await supabase
            .from('invoices')
            .update({
              stripe_invoice_id: invoice.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              amount_paid: invoice.amount_paid || 0,
              currency: invoice.currency,
              status: 'payment_failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbInvoice.id)
            .select('id, client_id, contract_id, invoice_number')
            .single();
          if (updErr) throw updErr;
          dbInvoice = updatedInvoice;
        } else {
          const { data: insertedInvoice, error: insErr } = await supabase
            .from('invoices')
            .insert({
              client_id: clientId,
          stripe_invoice_id: invoice.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              invoice_number: invoice.number || `STRIPE-${invoice.id}`,
              amount: amountMoney,
              amount_paid: invoice.amount_paid || 0,
              currency: invoice.currency,
              issue_date: new Date((invoice.created || Date.now() / 1000) * 1000).toISOString().slice(0, 10),
              due_date: stripeDueDate,
          status: 'payment_failed',
              updated_at: new Date().toISOString(),
            })
            .select('id, client_id, contract_id, invoice_number')
            .single();
          if (insErr) throw insErr;
          dbInvoice = insertedInvoice;
        }

        const emitted = await emitEvent(
          {
            eventType: 'invoice.payment_failed',
            entityType: 'invoice',
            entityId: dbInvoice?.id,
            actorUserId: null,
            payload: {
              stripe_event_id: event.id,
              stripe_invoice_id: invoice.id,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              client_id: dbInvoice?.client_id || clientId,
              contract_id: dbInvoice?.contract_id || null,
              invoice_number: dbInvoice?.invoice_number || invoice.number,
              amount: amountMoney,
              currency: invoice.currency,
              due_date: stripeDueDate,
              customer_email: customerEmail || null,
            },
          },
          supabase
        );

        try {
          const r = await handleEvent(emitted as any);
          if (r.ok) await markEventProcessed(emitted.id, supabase);
          else await markEventError(emitted.id, r.error, supabase);
        } catch (e: any) {
          await markEventError(emitted.id, e?.message || 'Erro ao processar evento invoice.payment_failed', supabase);
        }
        
        // Notificar sobre falha no pagamento (in-app + email best-effort)
        const title = 'Pagamento falhou (Stripe)';
        const hostedUrl = (invoice as any)?.hosted_invoice_url ? String((invoice as any).hosted_invoice_url) : '';
        const msg = `Falha no pagamento da fatura ${invoice.number || invoice.id} (vencimento: ${stripeDueDate}).`;

        try {
          await notifyAreaUsers({
            area: 'Financeiro',
            title,
            message: msg,
            link: '/admin/dashboard',
            type: 'stripe',
            metadata: {
              stripe_invoice_id: invoice.id,
              stripe_customer_id: stripeCustomerId,
              client_id: dbInvoice?.client_id || clientId,
              invoice_id: dbInvoice?.id || null,
              invoice_number: invoice.number || null,
              hosted_invoice_url: hostedUrl || null,
            },
          });
        } catch {
          // ignore
        }

        try {
          const envKey = (process.env.SENDGRID_API_KEY || '').trim();
          const { data: sg } = await supabase
            .from('integration_configs')
            .select('status, api_key, config')
            .eq('integration_id', 'sendgrid')
            .maybeSingle();
          const dbKey = (sg?.status === 'connected' ? String(sg?.api_key || '') : '').trim();
          const apiKey = dbKey || envKey || 'mailto';
          const fromEmail = sg?.config?.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@valle360.com.br';
          const fromName = sg?.config?.fromName || process.env.SENDGRID_FROM_NAME || 'Valle 360';
          const toList = String(process.env.FINANCE_ALERT_EMAILS || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (toList.length > 0) {
            const client = createSendGridClient({ apiKey, fromEmail, fromName });
            const tpl = EMAIL_TEMPLATES.notification(title, msg, hostedUrl || undefined, hostedUrl ? 'Abrir fatura' : undefined);
            await client.sendEmail({
              to: toList.map((e) => ({ email: e })),
              subject: tpl.subject,
              html: tpl.html,
              categories: ['valle360', 'stripe'],
            });
          }
        } catch {
          // ignore
        }
        
        return { success: true, action: 'invoice_payment_failed' };
      }

      // ========== CLIENTES ==========
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        
        // Vincular cliente Stripe ao usuário do sistema
        if (customer.email) {
          await supabase.from('clients').update({
            stripe_customer_id: customer.id
          }).or(`email.eq.${customer.email},contact_email.eq.${customer.email}`);
        }
        
        return { success: true, action: 'customer_created' };
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        
        // Atualizar dados do cliente se necessário
        await supabase.from('clients').update({
          updated_at: new Date().toISOString()
        }).eq('stripe_customer_id', customer.id);
        
        return { success: true, action: 'customer_updated' };
      }

      // ========== DISPUTAS ==========
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        
        // Registrar disputa
        await supabase.from('payment_disputes').insert({
          stripe_dispute_id: dispute.id,
          stripe_charge_id: dispute.charge,
          amount: dispute.amount,
          currency: dispute.currency,
          reason: dispute.reason,
          status: dispute.status,
          created_at: new Date().toISOString()
        });
        
        // TODO: Notificar equipe financeira
        
        return { success: true, action: 'dispute_created' };
      }

      default:
        // Evento não tratado
        console.log(`Evento Stripe não tratado: ${event.type}`);
        return { success: true, action: 'ignored' };
    }
  } catch (error: any) {
    console.error(`Erro ao processar evento ${event.type}:`, error);
    return { success: false, error: error.message };
  }
}






