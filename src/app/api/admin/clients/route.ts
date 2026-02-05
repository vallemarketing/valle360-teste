import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const adminSupabase = createClient(
  supabaseUrl || 'https://setup-missing.supabase.co',
  supabaseServiceKey || 'setup-missing',
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

async function requireUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) return null;
  const { data: { user } } = await adminSupabase.auth.getUser(token);
  return user || null;
}

function mapAccountStatusToUi(status: string | null | undefined): 'active' | 'inactive' | 'pending' {
  const s = (status || '').toLowerCase();
  if (s.includes('pend')) return 'pending';
  if (s.includes('inact') || s.includes('block') || s.includes('suspend')) return 'inactive';
  return 'active';
}

// GET - listar clientes
export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // 1) Tenta via clients + users + contracts
  try {
    const { data: clientsRows, error: clientsError } = await adminSupabase
      .from('clients')
      .select('id,user_id,nome_fantasia,razao_social,area_atuacao,cidade,estado,whatsapp,site,cpf_cnpj,created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (clientsError) throw clientsError;

    const userIds = (clientsRows || []).map((c: any) => c.user_id).filter(Boolean);

    // users: tentamos colunas mais ricas, mas fazemos fallback se não existirem
    let usersRows: any[] = [];
    {
      const tryRich = await adminSupabase
        .from('users')
        .select('id,email,full_name,phone,account_status,name,role,user_type')
        .in('id', userIds);
      if (!tryRich.error) usersRows = tryRich.data || [];
      else {
        const tryBasic = await adminSupabase.from('users').select('id,email,name,role').in('id', userIds);
        usersRows = tryBasic.data || [];
      }
    }

    const usersById = new Map(usersRows.map((u: any) => [u.id, u]));

    // contratos (mensalidade)
    const { data: contractsRows } = await adminSupabase
      .from('contracts')
      .select('client_id,monthly_value,start_date,status,created_at')
      .in('client_id', (clientsRows || []).map((c: any) => c.id))
      .order('created_at', { ascending: false });

    const bestContractByClient = new Map<string, any>();
    for (const c of contractsRows || []) {
      if (!bestContractByClient.has(c.client_id)) bestContractByClient.set(c.client_id, c);
    }

    const result = (clientsRows || []).map((c: any) => {
      const u = usersById.get(c.user_id) || {};
      const contract = bestContractByClient.get(c.id);

      const companyName = c.nome_fantasia || c.razao_social || u.company_name || u.name || u.email || 'Cliente';
      const contactName = u.full_name || u.name || u.email || 'Contato';
      const email = u.email || '';
      const phone = u.phone || c.whatsapp || '';
      const industry = c.area_atuacao || '—';
      const monthlyValue = Number(contract?.monthly_value || 0);
      const startDate = contract?.start_date || c.created_at || new Date().toISOString();
      const status = mapAccountStatusToUi(u.account_status || (u.is_active === false ? 'inactive' : 'active'));

      return {
        id: c.id,
        userId: c.user_id,
        companyName,
        contactName,
        email,
        phone,
        industry,
        status,
        monthlyValue,
        startDate,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(companyName)}`,
        address: c.logradouro ? `${c.logradouro}, ${c.numero || ''}`.trim() : undefined,
        city: c.cidade,
        state: c.estado,
        cnpj: c.cpf_cnpj,
        website: c.site,
      };
    });

    return NextResponse.json({ clients: result });
  } catch (e: any) {
    // 2) Fallback: user_profiles
    const { data: profiles } = await adminSupabase
      .from('user_profiles')
      .select('user_id,full_name,email,phone,user_type,is_active,metadata,created_at')
      .in('user_type', ['client', 'cliente'])
      .limit(500);

    const result = (profiles || []).map((p: any) => {
      const companyName = p.metadata?.company_name || p.full_name || p.email || 'Cliente';
      return {
        id: p.user_id,
        userId: p.user_id,
        companyName,
        contactName: p.full_name || p.email || 'Contato',
        email: p.email || '',
        phone: p.phone || '',
        industry: p.metadata?.industry || '—',
        status: p.is_active === false ? 'inactive' : 'active',
        monthlyValue: 0,
        startDate: p.created_at || new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(companyName)}`,
      };
    });

    return NextResponse.json({ clients: result, warning: 'fallback_user_profiles' });
  }
}

// PUT - ativar/desativar cliente (status)
export async function PUT(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const { userId, status } = body || {};

  if (!userId || !status) {
    return NextResponse.json({ error: 'userId e status são obrigatórios' }, { status: 400 });
  }

  // Tenta atualizar em users.account_status; se não existir, cai para user_profiles.is_active
  const desired = String(status);
  const tryUsers = await adminSupabase
    .from('users')
    .update({ account_status: desired })
    .eq('id', userId);

  if (!tryUsers.error) return NextResponse.json({ success: true });

  const isActive = desired === 'active';
  const tryProfiles = await adminSupabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('user_id', userId);

  if (tryProfiles.error) {
    return NextResponse.json({ error: 'Falha ao atualizar status' }, { status: 500 });
  }

  return NextResponse.json({ success: true, fallback: 'user_profiles' });
}

// POST - salvar features habilitadas por cliente
export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const { clientId, features } = body || {};

  if (!clientId || !Array.isArray(features)) {
    return NextResponse.json({ error: 'clientId e features são obrigatórios' }, { status: 400 });
  }

  const { data: featureRows, error: featureErr } = await adminSupabase
    .from('features')
    .select('id,code')
    .in('code', features.map((f: any) => f.code));

  if (featureErr) return NextResponse.json({ error: featureErr.message }, { status: 500 });

  const featureIdByCode = new Map((featureRows || []).map((f: any) => [f.code, f.id]));

  const upserts = features
    .map((f: any) => {
      const featureId = featureIdByCode.get(f.code);
      if (!featureId) return null;
      return {
        client_id: clientId,
        feature_id: featureId,
        is_enabled: !!f.enabled,
        enabled_by: 'manual',
        enabled_by_user_id: user.id,
        enabled_at: f.enabled ? new Date().toISOString() : null,
      };
    })
    .filter(Boolean);

  if (upserts.length === 0) return NextResponse.json({ success: true, updated: 0 });

  const { error: upsertErr } = await adminSupabase
    .from('client_features')
    .upsert(upserts, { onConflict: 'client_id,feature_id' });

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  return NextResponse.json({ success: true, updated: upserts.length });
}


