import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

const PASSWORD = 'Valle@Teste2024';

function departmentFromAreas(areas: string[]): string {
  const a = (areas || []).map((x) => String(x).toLowerCase());
  if (a.includes('rh')) return 'hr';
  if (a.some((x) => x.includes('financeiro'))) return 'finance';
  if (a.includes('comercial')) return 'sales';
  if (a.some((x) => x.includes('designer') || x.includes('design'))) return 'design';
  // tráfego/head/social -> marketing (no enum do schema moderno é social_media)
  if (a.some((x) => x.includes('social') || x.includes('trafego') || x.includes('marketing'))) return 'social_media';
  return 'admin';
}

const TEST_EMPLOYEES: Array<{
  email: string;
  full_name: string;
  department: string;
  areas: string[];
}> = [
  {
    email: 'social.media@valle360.com.br',
    full_name: 'Social Media (Teste)',
    department: departmentFromAreas(['social_media']),
    areas: ['social_media'],
  },
  {
    email: 'head.marketing@valle360.com.br',
    full_name: 'Head Marketing (Teste)',
    department: departmentFromAreas(['head_marketing']),
    areas: ['head_marketing'],
  },
  {
    email: 'joao.comercial@valle360.com.br',
    full_name: 'João Comercial (Teste)',
    department: departmentFromAreas(['comercial']),
    areas: ['comercial'],
  },
  {
    email: 'maria.trafego@valle360.com.br',
    full_name: 'Maria Tráfego (Teste)',
    department: departmentFromAreas(['trafego_pago']),
    areas: ['trafego_pago'],
  },
  {
    email: 'carlos.designer@valle360.com.br',
    full_name: 'Carlos Designer (Teste)',
    department: departmentFromAreas(['designer_grafico']),
    areas: ['designer_grafico'],
  },
  {
    email: 'ana.head@valle360.com.br',
    full_name: 'Ana Head Marketing (Teste)',
    department: departmentFromAreas(['head_marketing']),
    areas: ['head_marketing'],
  },
  {
    email: 'paula.rh@valle360.com.br',
    full_name: 'Paula RH (Teste)',
    department: departmentFromAreas(['rh']),
    areas: ['rh'],
  },
  {
    email: 'roberto.financeiro@valle360.com.br',
    full_name: 'Roberto Financeiro (Teste)',
    department: departmentFromAreas(['financeiro_pagar', 'financeiro_receber']),
    areas: ['financeiro_pagar', 'financeiro_receber'],
  },
];

async function findAuthUserIdByEmail(admin: ReturnType<typeof getSupabaseAdmin>, email: string): Promise<string | null> {
  // 1) Tenta via "search" (mais rápido e não depende de paginação)
  try {
    const { data } = await (admin.auth.admin as any).listUsers({ page: 1, perPage: 5, search: email });
    const found = (data?.users || []).find((u: any) => String(u?.email || '').toLowerCase() === email.toLowerCase());
    if (found?.id) return String(found.id);
  } catch {
    // ignore
  }

  // 2) Fallback: ambientes grandes -> paginação limitada (best-effort)
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const found = (data?.users || []).find((u: any) => String(u?.email || '').toLowerCase() === email.toLowerCase());
    if (found?.id) return String(found.id);
    if ((data?.users || []).length < 200) break;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: authData } = await supabaseAuth.auth.getUser();
    const actorUserId = authData.user?.id;
    if (!actorUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: isAdmin, error: isAdminError } = await supabaseAuth.rpc('is_admin');
    if (isAdminError || !isAdmin) return NextResponse.json({ error: 'Acesso negado (admin)' }, { status: 403 });

    const supabaseAdmin = getSupabaseAdmin();

    const credentials: Array<{ email: string; password: string; type: 'employee' | 'client' }> = [];
    const createdEmployees: Array<{ email: string; user_id: string; employee_id?: string | null }> = [];
    const warnings: Array<{ email: string; warning: string }> = [];

    async function resolveUserIdFromPublicTables(email: string): Promise<string | null> {
      const emailLower = email.toLowerCase();

      // users
      try {
        const { data } = await supabaseAdmin.from('users').select('id,email').eq('email', emailLower).maybeSingle();
        if (data?.id) return String(data.id);
      } catch {
        // ignore
      }

      // user_profiles
      try {
        const { data } = await supabaseAdmin
          .from('user_profiles')
          .select('user_id,email,id')
          .eq('email', emailLower)
          .maybeSingle();
        if ((data as any)?.user_id) return String((data as any).user_id);
        if ((data as any)?.id) return String((data as any).id);
      } catch {
        // ignore
      }

      // employees
      try {
        const { data } = await supabaseAdmin.from('employees').select('user_id,email').eq('email', emailLower).maybeSingle();
        if ((data as any)?.user_id) return String((data as any).user_id);
      } catch {
        // ignore
      }

      // clients
      try {
        const { data } = await supabaseAdmin
          .from('clients')
          .select('user_id,contact_email,email')
          .or(`email.eq.${emailLower},contact_email.eq.${emailLower}`)
          .maybeSingle();
        if ((data as any)?.user_id) return String((data as any).user_id);
      } catch {
        // ignore
      }

      return null;
    }

    for (const t of TEST_EMPLOYEES) {
      let userId: string | null = null;
      try {
        userId = (await findAuthUserIdByEmail(supabaseAdmin, t.email)) || (await resolveUserIdFromPublicTables(t.email));

        if (!userId) {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: t.email,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: {
              full_name: t.full_name,
              user_type: 'employee',
              role: 'employee',
            },
          });

          if (error || !data.user?.id) {
            const msg = String(error?.message || '');
            // Caso clássico: já existe no Auth, mas não encontramos pelo listUsers
            if (msg.toLowerCase().includes('already been registered') || msg.toLowerCase().includes('already registered')) {
              userId = (await findAuthUserIdByEmail(supabaseAdmin, t.email)) || (await resolveUserIdFromPublicTables(t.email));
              if (!userId) throw new Error(`Usuário já existe no Auth, mas não consegui resolver o ID por email (${t.email}).`);
              warnings.push({ email: t.email, warning: 'Usuário já existia; senha foi redefinida.' });
            } else {
              throw new Error(error?.message || `Falha ao criar auth user (${t.email})`);
            }
          } else {
            userId = String(data.user.id);
          }
        }

        // garante senha e confirmação sempre (idempotente)
        if (userId) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: PASSWORD,
            email_confirm: true,
            user_metadata: {
              full_name: t.full_name,
              user_type: 'employee',
              role: 'employee',
            },
          });
        }
      } catch (e: any) {
        warnings.push({ email: t.email, warning: e?.message || 'Falha ao criar/reativar' });
        continue; // não para o lote inteiro
      }

      if (!userId) {
        warnings.push({ email: t.email, warning: 'Não foi possível resolver userId.' });
        continue;
      }

      // public.users (para redirecionamento/login)
      await supabaseAdmin.from('users').upsert(
        {
          id: userId,
          email: t.email,
          full_name: t.full_name,
          name: t.full_name,
          role: 'employee',
          user_type: 'employee',
          account_status: 'active',
          is_active: true,
          email_verified: true,
          created_by: actorUserId,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'id' }
      );

      // user_profiles (hub)
      await supabaseAdmin.from('user_profiles').upsert(
        {
          id: userId,
          user_id: userId,
          email: t.email,
          full_name: t.full_name,
          user_type: 'employee',
          role: 'employee',
          is_active: true,
          updated_at: new Date().toISOString(),
          metadata: { created_as_test: true, areas: t.areas },
        } as any,
        { onConflict: 'user_id' }
      );

      // employees (fonte de employee_area_keys)
      let empRow: any = null;
      try {
        const { data, error } = await supabaseAdmin
          .from('employees')
          .upsert(
            {
              user_id: userId,
              full_name: t.full_name,
              email: t.email,
              department: t.department,
              position: 'Colaborador',
              areas: t.areas,
              is_active: true,
              updated_at: new Date().toISOString(),
              metadata: { created_as_test: true, department_label: t.department, areas: t.areas },
            } as any,
            { onConflict: 'email' }
          )
          .select('id')
          .maybeSingle();
        if (error) throw error;
        empRow = data;
      } catch (e: any) {
        // fallback (schemas antigos podem não ter department/areas/metadata)
        const { data } = await supabaseAdmin
          .from('employees')
          .upsert(
            {
              user_id: userId,
              full_name: t.full_name,
              email: t.email,
              position: 'Colaborador',
              is_active: true,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: 'email' }
          )
          .select('id')
          .maybeSingle();
        empRow = data;
      }

      createdEmployees.push({ email: t.email, user_id: userId, employee_id: (empRow as any)?.id || null });
      credentials.push({ email: t.email, password: PASSWORD, type: 'employee' });
    }

    // Cliente de teste (pedido: cliente@teste.com.br)
    const testClientEmail = 'cliente@teste.com.br';
    const testClientName = 'Cliente Teste (Provisório)';

    const existingClientAuthId = await findAuthUserIdByEmail(supabaseAdmin, testClientEmail);
    let clientUserId = existingClientAuthId;

    if (!clientUserId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testClientEmail,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: testClientName,
          user_type: 'client',
          role: 'client',
        },
      });
      if (error || !data.user?.id) throw new Error(error?.message || `Falha ao criar auth user (${testClientEmail})`);
      clientUserId = String(data.user.id);
    } else {
      await supabaseAdmin.auth.admin.updateUserById(clientUserId, {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: testClientName,
          user_type: 'client',
          role: 'client',
        },
      });
    }

    await supabaseAdmin.from('users').upsert(
      {
        id: clientUserId,
        email: testClientEmail,
        full_name: testClientName,
        name: testClientName,
        role: 'client',
        user_type: 'client',
        account_status: 'active',
        is_active: true,
        email_verified: true,
        created_by: actorUserId,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'id' }
    );

    await supabaseAdmin.from('user_profiles').upsert(
      {
        id: clientUserId,
        user_id: clientUserId,
        email: testClientEmail,
        full_name: testClientName,
        user_type: 'client',
        role: 'client',
        is_active: true,
        updated_at: new Date().toISOString(),
        metadata: { created_as_test: true },
      } as any,
      { onConflict: 'user_id' }
    );

    const { data: existingClientRow } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', clientUserId)
      .maybeSingle();

    let clientId: string | null = null;
    if (existingClientRow?.id) {
      const { data: updated } = await supabaseAdmin
        .from('clients')
        .update({
          company_name: testClientName,
          contact_name: testClientName,
          contact_email: testClientEmail,
          email: testClientEmail,
          status: 'active',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', existingClientRow.id)
        .select('id')
        .single();
      clientId = updated?.id ? String(updated.id) : String(existingClientRow.id);
    } else {
      const { data: inserted } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: clientUserId,
          company_name: testClientName,
          contact_name: testClientName,
          contact_email: testClientEmail,
          contact_phone: '(11) 99999-0000',
          city: 'São Paulo',
          state: 'SP',
          status: 'active',
          email: testClientEmail,
          whatsapp: '(11) 99999-0000',
          nome_fantasia: testClientName,
          razao_social: `${testClientName} Ltda`,
          tipo_pessoa: 'juridica',
          cpf_cnpj: '00.000.000/0001-00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .select('id')
        .single();
      clientId = inserted?.id ? String(inserted.id) : null;
    }

    credentials.push({ email: testClientEmail, password: PASSWORD, type: 'client' });

    return NextResponse.json({
      success: true,
      password: PASSWORD,
      users: createdEmployees, // compat
      credentials,
      warnings,
      client: { email: testClientEmail, user_id: clientUserId, client_id: clientId },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}


