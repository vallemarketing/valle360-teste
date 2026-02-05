import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { clientId } = params;
  const db = getSupabaseAdmin();

  try {
    let client: any = null;
    const { data: byId } = await db
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    if (byId) client = byId;
    if (!client) {
      const { data: byUserId } = await db
        .from('clients')
        .select('*')
        .eq('user_id', clientId)
        .single();
      if (byUserId) client = byUserId;
    }

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const userId = client.user_id;
    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    const { data: profile } = await db
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ client, user, profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.res;

  const { clientId } = params;
  const db = getSupabaseAdmin();
  const body = await request.json();

  try {
    let client: any = null;
    const { data: byId } = await db
      .from('clients')
      .select('id,user_id')
      .eq('id', clientId)
      .single();
    if (byId) client = byId;
    if (!client) {
      const { data: byUserId } = await db
        .from('clients')
        .select('id,user_id')
        .eq('user_id', clientId)
        .single();
      if (byUserId) client = byUserId;
    }

    if (!client?.user_id) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const userId = client.user_id;
    const updates: any = {};
    if (body.company_name) updates.company_name = body.company_name;
    if (body.contact_name) updates.contact_name = body.contact_name;
    if (body.email) {
      updates.contact_email = body.email;
      updates.email = body.email; // compat
    }
    if (body.phone) updates.contact_phone = body.phone;
    if (body.whatsapp) updates.whatsapp = body.whatsapp;
    if (body.industry) updates.industry = body.industry;
    if (body.website) updates.website = body.website;
    if (body.address) updates.address = body.address;
    if (body.city) updates.cidade = body.city;
    if (body.state) updates.estado = body.state;
    if (body.cpf_cnpj) updates.cpf_cnpj = body.cpf_cnpj;
    if (body.status) updates.status = body.status;
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      await db.from('clients').update(updates).eq('id', client.id);
    }

    if (body.full_name || body.phone || body.email || body.account_status) {
      await db
        .from('users')
        .update({
          ...(body.full_name && { full_name: body.full_name, name: body.full_name }),
          ...(body.phone && { phone: body.phone }),
          ...(body.email && { email: body.email }),
          ...(body.account_status && { account_status: body.account_status }),
        })
        .eq('id', userId);
    }

    if (body.full_name || body.phone || body.email) {
      await db
        .from('user_profiles')
        .update({
          ...(body.full_name && { full_name: body.full_name }),
          ...(body.phone && { phone: body.phone }),
          ...(body.email && { email: body.email }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    if (body.email) {
      await db.auth.admin.updateUserById(userId, { email: body.email });
    }
    if (body.password) {
      await db.auth.admin.updateUserById(userId, { password: body.password });
    }

    return NextResponse.json({ success: true, message: 'Cliente atualizado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
