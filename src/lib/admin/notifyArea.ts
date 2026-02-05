import { getSupabaseAdmin } from '@/lib/admin/supabaseAdmin';

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function areaMatchesEmployee(area: string, employee: { department?: string | null; areas?: string[] | null }) {
  const target = normalizeText(area);
  const dept = employee.department ? normalizeText(employee.department) : '';
  const areas = Array.isArray(employee.areas) ? employee.areas.map(normalizeText) : [];

  if (!target) return false;

  // match direto
  if (dept === target) return true;
  if (areas.includes(target)) return true;

  // match por inclusão (ex: "juridico" dentro de "Jurídico / Compliance")
  if (dept.includes(target) || target.includes(dept)) return true;
  if (areas.some((a) => a.includes(target) || target.includes(a))) return true;

  // aliases comuns
  const aliases: Record<string, string[]> = {
    operacao: ['operacao', 'operacional', 'ops'],
    financeiro: ['financeiro', 'finance', 'cobranca', 'cobrança'],
    comercial: ['comercial', 'vendas', 'sales'],
    juridico: ['juridico', 'juridico/compliance', 'compliance'],
    contratos: ['contratos', 'contract'],
    notificacoes: ['notificacoes', 'notificacoes-e-alertas', 'notificacoes/alertas'],
    rh: ['rh', 'people', 'pessoas'],
  };

  const normalizedAliases = aliases[target] || [];
  if (normalizedAliases.length > 0) {
    if (normalizedAliases.some((a) => dept.includes(a))) return true;
    if (normalizedAliases.some((a) => areas.some((x) => x.includes(a)))) return true;
  }

  return false;
}

export async function notifyAreaUsers(params: {
  area: string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
  type?: string;
}) {
  const supabase = getSupabaseAdmin();

  // Buscar colaboradores ativos e filtrar localmente para permitir match case/acentos
  const { data: employees } = await supabase
    .from('employees')
    .select('user_id, department, areas, is_active')
    .eq('is_active', true);

  const userIds = (employees || [])
    .filter((e: any) => e?.user_id && areaMatchesEmployee(params.area, e))
    .map((e: any) => String(e.user_id));

  // Se ainda não existe nenhum colaborador cadastrado para essa área,
  // criamos um "inbox por área" como broadcast (user_id = null).
  // O endpoint /api/notifications filtra esse tipo para não-admins via metadata.audience = 'area'.
  if (userIds.length === 0) {
    const row = {
      user_id: null,
      title: params.title,
      message: params.message,
      type: params.type || 'workflow',
      is_read: false,
      link: params.link ?? '/admin/fluxos',
      metadata: {
        ...(params.metadata || {}),
        area: params.area,
        audience: 'area',
      },
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('notifications').insert(row);
    } catch {
      // ignore
    }
    return;
  }

  const rows = userIds.map((userId) => ({
    user_id: userId,
    title: params.title,
    message: params.message,
    type: params.type || 'workflow',
    is_read: false,
    link: params.link ?? '/colaborador/notificacoes',
    metadata: {
      ...(params.metadata || {}),
      area: params.area,
      audience: 'area',
    },
    created_at: new Date().toISOString(),
  }));

  // best-effort
  try {
    await supabase.from('notifications').insert(rows);
  } catch {
    // ignore
  }
}


