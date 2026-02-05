/**
 * Client Dashboard Feed
 * - Próxima reunião (calendar_events) para o cliente
 * - Atividades recentes (best-effort): client_ai_insights, files, event_log
 *
 * Objetivo: remover mocks do dashboard do cliente sem depender de integrações externas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

function timeAgoPtBR(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days} dia${days > 1 ? 's' : ''} atrás`;
}

function isMissingTableError(e: any) {
  const msg = String(e?.message || '').toLowerCase();
  const code = String(e?.code || '');
  return code === '42P01' || msg.includes('relation') || msg.includes('does not exist');
}

function formatMeetingDatePtBR(date: Date) {
  // Ex.: "15 Dez"
  const dtf = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  });
  // "15 de dez." -> "15 Dez"
  const raw = dtf.format(date);
  const cleaned = raw.replace(' de ', ' ').replace('.', '');
  const parts = cleaned.split(' ').filter(Boolean);
  const day = parts[0] || '';
  const mon = (parts[1] || '').slice(0, 3);
  return `${day} ${mon.charAt(0).toUpperCase()}${mon.slice(1)}`;
}

function formatMeetingTimePtBR(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

type ActivityType = 'approval' | 'file' | 'message' | 'notification' | 'task';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const admin = getSupabaseAdmin();

    const { data: client, error: clientErr } = await admin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
    const clientId = client?.id ? String(client.id) : null;
    if (!clientId) return NextResponse.json({ error: 'Cliente não vinculado (clients.user_id)' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const maxItems = Math.max(1, Math.min(20, Number(searchParams.get('maxItems') || 6) || 6));

    // ===== Próxima reunião =====
    let nextMeeting: any = null;
    try {
      const nowIso = new Date().toISOString();
      const { data: ev, error } = await admin
        .from('calendar_events')
        .select('id,title,start_date,end_date,organizer_id,location,event_type')
        .eq('client_id', clientId)
        .gte('start_date', nowIso)
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (ev) {
        const organizerId = ev.organizer_id ? String(ev.organizer_id) : null;
        let organizerName: string | null = null;
        let organizerRole: string | null = null;

        if (organizerId) {
          const [{ data: profile }, { data: employee }] = await Promise.all([
            admin.from('user_profiles').select('full_name,role').eq('user_id', organizerId).maybeSingle(),
            admin.from('employees').select('role,position,department').eq('user_id', organizerId).maybeSingle(),
          ]);
          organizerName = profile?.full_name ? String(profile.full_name) : null;
          organizerRole =
            (employee?.position ? String(employee.position) : null) ||
            (employee?.role ? String(employee.role) : null) ||
            (profile?.role ? String(profile.role) : null);
        }

        const start = new Date(String((ev as any).start_date));
        nextMeeting = {
          id: String(ev.id),
          title: String(ev.title || 'Reunião'),
          date: formatMeetingDatePtBR(start),
          time: formatMeetingTimePtBR(start),
          with: organizerName || 'Equipe Valle',
          withRole: organizerRole || 'Atendimento',
          href: '/cliente/agenda',
        };
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // Ignorar falha pontual; UI cai no fallback
      }
      nextMeeting = null;
    }

    // ===== Atividades recentes (best-effort) =====
    const activities: Array<{ id: string; type: ActivityType; title: string; createdAt: string; time: string; read: boolean }> = [];

    const pushActivity = (a: { id: string; type: ActivityType; title: string; createdAt: string }) => {
      const createdAt = a.createdAt;
      const diff = Date.now() - new Date(createdAt).getTime();
      const read = diff > 24 * 3600 * 1000; // >24h = lido
      activities.push({ id: a.id, type: a.type, title: a.title, createdAt, time: timeAgoPtBR(createdAt), read });
    };

    // 1) Insights (hoje/recente)
    try {
      const { data, error } = await admin
        .from('client_ai_insights')
        .select('id,title,created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(maxItems);
      if (error) throw error;
      for (const row of data || []) {
        pushActivity({
          id: `insight:${row.id}`,
          type: 'notification',
          title: row.title ? `Novo insight: ${String(row.title)}` : 'Novo insight disponível',
          createdAt: String((row as any).created_at),
        });
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // ignore
      }
    }

    // 2) Arquivos do cliente
    try {
      const { data, error } = await admin
        .from('files')
        .select('id,file_name,created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(maxItems);
      if (error) throw error;
      for (const row of data || []) {
        pushActivity({
          id: `file:${row.id}`,
          type: 'file',
          title: row.file_name ? `Arquivo: ${String(row.file_name)}` : 'Novo arquivo disponível',
          createdAt: String((row as any).created_at),
        });
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // ignore
      }
    }

    // 3) Event log (hub) — best-effort (filtragem em memória para evitar filtros frágeis em JSON)
    try {
      const { data, error } = await admin
        .from('event_log')
        .select('id,event_type,created_at,payload,status')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;

      for (const row of data || []) {
        const payload = ((row as any).payload || {}) as any;
        const payloadClientId = String(payload.client_id || payload.clientId || '').trim();
        if (!payloadClientId || payloadClientId !== clientId) continue;

        const t = String((row as any).event_type || '').toLowerCase();
        let type: ActivityType = 'notification';
        let title = String((row as any).event_type || 'Atualização');

        if (t.startsWith('invoice.')) {
          type = 'notification';
          if (t === 'invoice.paid') title = 'Pagamento confirmado';
          else if (t === 'invoice.payment_failed') title = 'Falha no pagamento';
          else title = 'Atualização financeira';
        } else if (t.includes('kanban') || t.includes('task')) {
          type = 'task';
          title = 'Atualização no Kanban';
        } else if (t.includes('message')) {
          type = 'message';
          title = 'Nova mensagem';
        } else if (t.includes('approval') || t.includes('approved')) {
          type = 'approval';
          title = 'Aprovação registrada';
        }

        pushActivity({
          id: `event:${row.id}`,
          type,
          title,
          createdAt: String((row as any).created_at),
        });
      }
    } catch (e: any) {
      if (!isMissingTableError(e)) {
        // ignore
      }
    }

    // Ordenar e limitar
    const unique = new Map<string, any>();
    for (const a of activities) unique.set(a.id, a);
    const merged = Array.from(unique.values())
      .sort((a: any, b: any) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
      .slice(0, maxItems);

    return NextResponse.json({
      success: true,
      nextMeeting,
      activities: merged.map(({ createdAt: _createdAt, ...rest }: any) => rest),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


