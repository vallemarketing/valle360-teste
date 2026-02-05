import { NextRequest, NextResponse } from 'next/server';
import { billingAutomation, type Invoice } from '@/lib/ai/billing-automation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar faturas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status') || undefined;
    const client_id = searchParams.get('client_id') || undefined;
    const overdue_only = searchParams.get('overdue_only') === 'true';

    // Relatório de inadimplência
    if (action === 'delinquency_report') {
      const report = await billingAutomation.generateDelinquencyReport();
      return NextResponse.json({ success: true, report });
    }

    // Buscar faturas
    const invoices = await billingAutomation.getInvoices({
      status,
      client_id,
      overdue_only
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar faturas' },
      { status: 500 }
    );
  }
}

// POST - Criar fatura ou executar ação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Processar cobranças automáticas
    if (action === 'process_overdue') {
      const result = await billingAutomation.processOverdueInvoices();
      return NextResponse.json({ success: true, result });
    }

    // Atualizar status de faturas vencidas
    if (action === 'update_overdue_status') {
      const updated = await billingAutomation.updateOverdueStatus();
      return NextResponse.json({ success: true, updated_count: updated });
    }

    // Criar nova fatura
    const invoice: Partial<Invoice> = {
      client_id: data.client_id,
      client_name: data.client_name,
      client_email: data.client_email,
      amount: data.amount,
      due_date: data.due_date,
      status: 'pending',
      items: data.items || [],
      reminder_count: 0,
      created_at: new Date().toISOString()
    };

    const { data: savedInvoice, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar fatura' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, invoice: savedInvoice });
  } catch (error) {
    console.error('Erro na API de billing:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar fatura
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da fatura é obrigatório' },
        { status: 400 }
      );
    }

    // Marcar como pago
    if (action === 'mark_paid') {
      const success = await billingAutomation.markAsPaid(id, {
        payment_method: data.payment_method,
        transaction_id: data.transaction_id
      });

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Erro ao marcar como pago' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Fatura marcada como paga' });
    }

    // Atualização geral
    const { error } = await supabase
      .from('invoices')
      .update(data)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar fatura' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Fatura atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar fatura:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar fatura' },
      { status: 500 }
    );
  }
}




