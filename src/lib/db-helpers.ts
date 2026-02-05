import { supabase } from './supabase';

/**
 * Helper para executar queries com contexto de usuário configurado
 * Isso garante que as RLS policies funcionem corretamente
 */
export async function withUserContext<T>(
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    // Configurar contexto do usuário na sessão
    await supabase.rpc('set_config', {
      setting_name: 'app.user_id',
      new_value: userId,
      is_local: true
    });

    // Executar a função
    const result = await fn();

    return result;
  } catch (error) {
    console.error('Erro ao executar query com contexto de usuário:', error);
    throw error;
  }
}

/**
 * Helper para executar múltiplas operações em transação
 * com contexto de usuário
 */
export async function withUserTransaction<T>(
  userId: string,
  operations: Array<() => Promise<any>>
): Promise<T[]> {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.user_id',
      new_value: userId,
      is_local: true
    });

    const results: T[] = [];

    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Erro na transação:', error);
    throw error;
  }
}

/**
 * Obter ID do usuário autenticado
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Verificar se usuário é admin de uma organização
 */
export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  return data?.role === 'admin';
}

/**
 * Verificar se usuário tem acesso a uma organização
 */
export async function canAccessOrg(userId: string, orgId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Obter organizações do usuário
 */
export async function getUserOrganizations(userId: string) {
  const { data, error } = await supabase
    .from('org_members')
    .select(`
      id,
      role,
      organizations (
        id,
        name,
        slug,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}
