import { AREA_BOARD_BY_KEY, inferAreaKeyFromEmployee, type AreaKey } from '@/lib/kanban/areaBoards';

export type EmployeeAreaSource = {
  department?: string | null;
  area_of_expertise?: string | null;
  areas?: string[] | null;
};

/**
 * Resolve uma área estável (AreaKey) a partir do registro do colaborador.
 * Usa a mesma fonte de verdade do Kanban (inferAreaKeyFromEmployee).
 */
export function resolveEmployeeAreaKey(source: EmployeeAreaSource): AreaKey | null {
  return inferAreaKeyFromEmployee({
    department: source.department ?? null,
    area_of_expertise: source.area_of_expertise ?? null,
    areas: Array.isArray(source.areas) ? source.areas : null,
  });
}

export function labelFromAreaKey(areaKey: AreaKey | null | undefined): string {
  if (!areaKey) return 'Colaborador';
  return AREA_BOARD_BY_KEY[areaKey]?.label || 'Colaborador';
}

/**
 * Converte AreaKey -> slug usado em dashboards/IA (compat).
 * Mantém nomes antigos enquanto migramos o resto para AreaKey.
 */
export function areaKeyToCompatArea(areaKey: AreaKey | null | undefined): string {
  if (!areaKey) return 'colaborador';
  switch (areaKey) {
    case 'designer_grafico':
      return 'designer';
    case 'social_media':
      return 'social_media';
    case 'head_marketing':
      return 'head_marketing';
    case 'trafego_pago':
      return 'trafego';
    case 'video_maker':
      return 'video_maker';
    case 'webdesigner':
      return 'web_designer';
    case 'copywriting':
      return 'copywriting';
    case 'comercial':
      return 'comercial';
    case 'juridico':
      return 'juridico';
    case 'contratos':
      return 'contratos';
    case 'operacao':
      return 'operacao';
    case 'notificacoes':
      return 'notificacoes';
    case 'financeiro_pagar':
    case 'financeiro_receber':
      return 'financeiro';
    case 'rh':
      return 'rh';
    default:
      return String(areaKey);
  }
}


