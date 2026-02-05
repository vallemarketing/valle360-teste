import type { SupabaseClient } from '@supabase/supabase-js';

export type PublicUserProfile = {
  user_id: string; // auth.users.id (ou equivalente)
  full_name: string;
  email?: string;
  avatar_url?: string;
  user_type?: string;
};

type RawUserProfile = {
  id?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
  user_type?: string | null;
  role?: string | null;
};

function normalizeProfileRow(row: RawUserProfile, keyUserId: string): PublicUserProfile {
  return {
    user_id: keyUserId,
    full_name: String(row.full_name || 'Usuário'),
    email: row.email ? String(row.email) : undefined,
    avatar_url: row.avatar_url ? String(row.avatar_url) : row.avatar ? String(row.avatar) : undefined,
    user_type: row.user_type ? String(row.user_type) : row.role ? String(row.role) : undefined,
  };
}

async function safeSelectByColumn(
  supabase: SupabaseClient,
  column: 'id' | 'user_id',
  userIds: string[]
): Promise<RawUserProfile[]> {
  try {
    const selectCols =
      column === 'id'
        ? 'id, full_name, email, avatar_url, avatar, user_type, role'
        : 'user_id, full_name, email, avatar_url, avatar, user_type, role';

    const { data, error } = await supabase
      .from('user_profiles')
      .select(selectCols)
      .in(column, userIds);

    if (error) return [];
    return (data || []) as any;
  } catch {
    return [];
  }
}

/**
 * Retorna um Map<authUserId, profile>.
 * Robusto para ambientes onde `user_profiles` usa `id = auth.uid()` OU onde existe a coluna `user_id`.
 */
export async function fetchProfilesMapByAuthIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, PublicUserProfile>> {
  const uniqueUserIds = Array.from(new Set((userIds || []).filter(Boolean)));
  const map = new Map<string, PublicUserProfile>();
  if (uniqueUserIds.length === 0) return map;

  // 1) Tentar `id IN (...)` (muito comum ser o auth.users.id)
  const byId = await safeSelectByColumn(supabase, 'id', uniqueUserIds);
  for (const row of byId) {
    const key = row?.id ? String(row.id) : null;
    if (!key) continue;
    map.set(key, normalizeProfileRow(row, key));
  }

  // 2) Tentar `user_id IN (...)` (alguns ambientes usam esse campo)
  const byUserId = await safeSelectByColumn(supabase, 'user_id', uniqueUserIds);
  for (const row of byUserId) {
    const key = row?.user_id ? String(row.user_id) : null;
    if (!key) continue;
    map.set(key, normalizeProfileRow(row, key));
  }

  return map;
}

export async function fetchProfileByAuthId(
  supabase: SupabaseClient,
  userId: string
): Promise<PublicUserProfile | null> {
  if (!userId) return null;
  const map = await fetchProfilesMapByAuthIds(supabase, [userId]);
  return map.get(userId) || null;
}


