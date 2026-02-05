import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export type NineBoxAccess = {
  userId: string;
  isAdmin: boolean;
  allowed: boolean;
  reason?: string;
  areaKeys: string[];
};

async function safeRpc<T>(supabase: SupabaseClient, fn: string, params?: Record<string, any>) {
  try {
    const { data, error } = await supabase.rpc(fn as any, params as any);
    if (error) return { ok: false as const, error };
    return { ok: true as const, data: data as T };
  } catch (e: any) {
    return { ok: false as const, error: e };
  }
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((x) => String(x)).filter(Boolean)));
}

export async function resolveNineBoxAccess(params: {
  supabase: ReturnType<typeof createRouteHandlerClient> | SupabaseClient;
}): Promise<NineBoxAccess> {
  const supabase = params.supabase as unknown as SupabaseClient;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { userId: '', isAdmin: false, allowed: false, reason: 'Não autenticado', areaKeys: [] };

  const isAdminRes = await safeRpc<boolean>(supabase, 'is_admin');
  const isAdmin = isAdminRes.ok ? Boolean(isAdminRes.data) : false;
  if (isAdmin) return { userId, isAdmin, allowed: true, areaKeys: [] };

  // Área do colaborador (preferir função do banco)
  const areaKeysRpc = await safeRpc<string[]>(supabase, 'employee_area_keys');
  if (areaKeysRpc.ok && Array.isArray(areaKeysRpc.data)) {
    const keys = uniq(areaKeysRpc.data);
    const allowed = keys.includes('rh');
    return { userId, isAdmin, allowed, reason: allowed ? undefined : 'Acesso restrito: RH', areaKeys: keys };
  }

  // Fallback: employees.areas / department
  const { data: emp } = await supabase
    .from('employees')
    .select('areas, department, is_active')
    .eq('user_id', userId)
    .maybeSingle();

  const keys = uniq([...(Array.isArray((emp as any)?.areas) ? ((emp as any).areas as any[]).map(String) : [])]);
  const allowed = keys.includes('rh') || String((emp as any)?.department || '').toLowerCase().includes('rh');

  return { userId, isAdmin, allowed, reason: allowed ? undefined : 'Acesso restrito: RH', areaKeys: keys };
}


