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

function randomToken(len = 6) {
  return Math.random().toString(36).slice(2, 2 + len);
}

export async function POST(request: NextRequest) {
  const actor = await requireUser(request);
  if (!actor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // valida super_admin usando tabela users (service role bypass)
  const { data: actorRow } = await adminSupabase
    .from('users')
    .select('role,user_type')
    .eq('id', actor.id)
    .maybeSingle();

  const actorRole = (actorRow as any)?.role || null;
  const actorType = (actorRow as any)?.user_type || null;
  const isSuperAdmin = actorRole === 'super_admin' || actorType === 'super_admin';
  if (!isSuperAdmin) return NextResponse.json({ error: 'Acesso negado (super_admin)' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const company_name =
    (body?.company_name as string | undefined) ||
    `Cliente Teste ${new Date().toLocaleDateString('pt-BR')}`;

  const email = `cliente.teste+${Date.now()}_${randomToken(4)}@valle360.com.br`;
  const password = `Valle@${Math.floor(Math.random() * 900000 + 100000)}!`;
  const full_name = (body?.full_name as string | undefined) || company_name;

  // 1) cria usuário auth
  const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, user_type: 'client' },
  });

  if (createErr || !created?.user?.id) {
    return NextResponse.json({ error: createErr?.message || 'Falha ao criar usuário' }, { status: 500 });
  }

  const userId = created.user.id;

  // 2) users (compat)
  await adminSupabase.from('users').upsert({
    id: userId,
    email,
    full_name,
    name: full_name,
    role: 'client',
    user_type: 'client',
    account_status: 'active',
    created_by: actor.id,
    created_at: new Date().toISOString(),
  } as any);

  // 3) user_profiles (hub)
  await adminSupabase.from('user_profiles').upsert({
    id: userId,
    user_id: userId,
    email,
    full_name,
    role: 'client',
    user_type: 'client',
    is_active: true,
    metadata: { created_as_test: true },
  } as any);

  // 4) clients
  const { data: client, error: clientErr } = await adminSupabase
    .from('clients')
    .insert({
      user_id: userId,
      company_name,
      contact_name: full_name,
      contact_email: email,
      status: 'active',
      is_active: true,
      onboarding_completed: false,
      // compat
      email,
      nome_fantasia: company_name,
      razao_social: company_name,
      created_at: new Date().toISOString(),
    } as any)
    .select('id')
    .single();

  if (clientErr || !client?.id) {
    return NextResponse.json({ error: clientErr?.message || 'Falha ao criar cliente' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    credentials: {
      email,
      password,
      client_id: String(client.id),
      user_id: userId,
    },
  });
}


