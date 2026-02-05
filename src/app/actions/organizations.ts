'use server';

import { supabase } from '@/lib/supabase';
import { getCurrentUserId, withUserContext } from '@/lib/db-helpers';
import { z } from 'zod';

// Schemas de validação
const CreateOrgSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens').optional(),
});

const AddMemberSchema = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['admin', 'member', 'viewer']),
});

export async function createOrganization(data: z.infer<typeof CreateOrgSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = CreateOrgSchema.parse(data);

  return withUserContext(userId, async () => {
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: validated.name,
        slug: validated.slug || validated.name.toLowerCase().replace(/\s+/g, '-'),
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Adicionar criador como admin
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: userId,
        role: 'admin',
      });

    if (memberError) throw memberError;

    return org;
  });
}

export async function addOrgMember(data: z.infer<typeof AddMemberSchema>) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  const validated = AddMemberSchema.parse(data);

  return withUserContext(userId, async () => {
    const { data: member, error } = await supabase
      .from('org_members')
      .insert({
        org_id: validated.orgId,
        user_id: validated.userId,
        role: validated.role,
      })
      .select()
      .single();

    if (error) throw error;
    return member;
  });
}

export async function updateMemberRole(memberId: string, newRole: 'admin' | 'member' | 'viewer') {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data, error } = await supabase
      .from('org_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  });
}

export async function removeMember(memberId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    return { success: true };
  });
}

export async function getOrganizationMembers(orgId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Não autenticado');

  return withUserContext(userId, async () => {
    const { data, error } = await supabase
      .from('org_members')
      .select(`
        id,
        role,
        created_at,
        user_profiles (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  });
}
