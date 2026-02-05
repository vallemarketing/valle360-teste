import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function daysBetween(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const admin = getSupabaseAdmin();
  const today = new Date();

  try {
    const { data: clients, error: clientsErr } = await admin
      .from('clients')
      .select('id, company_name, contact_email, contact_phone, status, user_id')
      .eq('is_active', true)
      .order('company_name', { ascending: true })
      .limit(500);
    if (clientsErr) throw clientsErr;

    const clientIds = (clients || []).map((c: any) => String(c.id));

    // Contratos ativos (somatório por client)
    const { data: contracts } = await admin
      .from('contracts')
      .select('client_id, value, status')
      .in('client_id', clientIds)
      .eq('status', 'active');

    const contractValueByClient = new Map<string, number>();
    for (const row of (contracts || []) as any[]) {
      const cid = String(row.client_id);
      const v = Number(row.value || 0);
      contractValueByClient.set(cid, (contractValueByClient.get(cid) || 0) + v);
    }

    // Invoices pendentes/abertas
    const { data: invoices } = await admin
      .from('invoices')
      .select('id, client_id, invoice_number, amount, due_date, paid_at, status')
      .in('client_id', clientIds)
      .order('due_date', { ascending: true });

    const invoicesByClient = new Map<string, any[]>();
    for (const inv of (invoices || []) as any[]) {
      const cid = String(inv.client_id);
      invoicesByClient.set(cid, [...(invoicesByClient.get(cid) || []), inv]);
    }

    const rows = (clients || []).map((c: any) => {
      const cid = String(c.id);
      const invs = invoicesByClient.get(cid) || [];

      const open = invs.filter((i) => !i.paid_at && String(i.status || '').toLowerCase() !== 'paid');
      const overdue = open.filter((i) => {
        const due = new Date(String(i.due_date));
        return !Number.isNaN(due.getTime()) && due.getTime() < today.getTime();
      });

      let payment_status: 'ok' | 'late' | 'pending' = 'ok';
      if (overdue.length > 0) payment_status = 'late';
      else if (open.length > 0) payment_status = 'pending';

      const nextBillingDue = open.length > 0 ? open[0] : null;
      const next_billing = nextBillingDue?.due_date ? String(nextBillingDue.due_date) : null;

      let days_late: number | undefined = undefined;
      if (overdue.length > 0) {
        // pega o mais atrasado (menor due_date)
        const mostOverdue = overdue.reduce((acc, cur) => {
          const a = new Date(String(acc.due_date)).getTime();
          const b = new Date(String(cur.due_date)).getTime();
          return a <= b ? acc : cur;
        }, overdue[0]);
        const due = new Date(String(mostOverdue.due_date));
        days_late = Number.isNaN(due.getTime()) ? undefined : Math.max(0, daysBetween(today, due));
      }

      const contract_value = contractValueByClient.get(cid) || 0;
      const health_score =
        payment_status === 'late' ? 45 : payment_status === 'pending' ? 75 : 92;

      return {
        id: cid,
        name: c.company_name,
        email: c.contact_email,
        phone: c.contact_phone,
        contract_value,
        status: String(c.status || 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
        payment_status,
        next_billing: next_billing || new Date().toISOString().slice(0, 10),
        health_score,
        days_late,
        user_id: c.user_id ? String(c.user_id) : null,
      };
    });

    return NextResponse.json({ success: true, clients: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erro ao carregar clientes financeiros' }, { status: 500 });
  }
}




