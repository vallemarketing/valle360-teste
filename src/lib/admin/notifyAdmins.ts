type SupabaseLike = {
  from: (table: string) => any;
};

export async function getAdminUserIds(supabase: SupabaseLike): Promise<string[]> {
  const { data } = await supabase
    .from('user_profiles')
    .select('user_id, user_type, is_active')
    .in('user_type', ['super_admin', 'admin'])
    .eq('is_active', true);

  return (data || [])
    .map((r: any) => r.user_id)
    .filter(Boolean)
    .map((id: any) => String(id));
}

export async function notifyAdmins(
  supabase: SupabaseLike,
  params: {
    title: string;
    message: string;
    type?: string;
    link?: string | null;
    metadata?: Record<string, unknown>;
    is_read?: boolean;
  }
) {
  const adminUserIds = await getAdminUserIds(supabase);
  if (adminUserIds.length === 0) return;

  const rows = adminUserIds.map((userId) => ({
    user_id: userId,
    title: params.title,
    message: params.message,
    type: params.type || 'system',
    is_read: params.is_read ?? false,
    link: params.link ?? null,
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  }));

  // best-effort: não falhar fluxo principal por causa de notificação
  try {
    await supabase.from('notifications').insert(rows);
  } catch {
    // ignore
  }
}


