import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { inferAreaKeyFromLabel, type AreaKey } from '@/lib/kanban/areaBoards';

export type SocialUploadAccess = {
  userId: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  allowed: boolean;
  reason?: string;
  areaKeys: AreaKey[];
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

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export async function resolveSocialUploadAccess(params: {
  supabase: ReturnType<typeof createRouteHandlerClient> | SupabaseClient;
}): Promise<SocialUploadAccess> {
  const supabase = params.supabase as unknown as SupabaseClient;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { userId: '', isSuperAdmin: false, isAdmin: false, allowed: false, reason: 'Não autenticado', areaKeys: [] };
  }

  // 1) Admin/Super Admin
  const isAdminRes = await safeRpc<boolean>(supabase, 'is_admin');
  const isAdmin = isAdminRes.ok ? Boolean(isAdminRes.data) : false;

  // 2) Super admin (função criada por migration)
  const isSuperAdminRes = await safeRpc<boolean>(supabase, 'is_super_admin');
  const isSuperAdmin = isSuperAdminRes.ok ? Boolean(isSuperAdminRes.data) : false;

  // Regra do produto: Admin tem acesso ao Post Center.
  if (isAdmin || isSuperAdmin) {
    return { userId, isSuperAdmin, isAdmin, allowed: true, areaKeys: [] };
  }

  // 3) Tentar pegar area_keys diretamente do banco (se a função existir)
  const areaKeysRpc = await safeRpc<string[]>(supabase, 'employee_area_keys');
  if (areaKeysRpc.ok && Array.isArray(areaKeysRpc.data)) {
    const keys = (areaKeysRpc.data || []).map((k) => String(k) as AreaKey);
    const allowed = keys.includes('social_media') || keys.includes('head_marketing');
    return {
      userId,
      isSuperAdmin,
      isAdmin,
      allowed,
      reason: allowed ? undefined : 'Acesso restrito: necessário Social Media ou Head Marketing',
      areaKeys: uniq(keys),
    };
  }

  // 4) Fallback: inferir a partir da tabela employees (mesma lógica do readiness)
  const { data: emp } = await supabase
    .from('employees')
    .select('department, area_of_expertise, areas, is_active')
    .eq('user_id', userId)
    .maybeSingle();

  const labels: string[] = [];
  if (emp?.department) labels.push(String(emp.department));
  if ((emp as any)?.area_of_expertise) labels.push(String((emp as any).area_of_expertise));
  if (Array.isArray((emp as any)?.areas)) labels.push(...((emp as any).areas as any[]).map((x) => String(x)));

  const keys = uniq(
    labels
      .map((l) => inferAreaKeyFromLabel(l))
      .filter(Boolean)
      .map((k) => k as AreaKey)
  );
  const allowed = keys.includes('social_media') || keys.includes('head_marketing');

  return {
    userId,
    isSuperAdmin,
    isAdmin,
    allowed,
    reason: allowed ? undefined : 'Acesso restrito: necessário Social Media ou Head Marketing',
    areaKeys: keys,
  };
}



