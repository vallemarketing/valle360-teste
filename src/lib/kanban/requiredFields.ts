import { AREA_BOARDS, type AreaKey, type StageGroup } from '@/lib/kanban/areaBoards';

export type KanbanRequiredField = 'description' | 'assigned_to';

export function resolveStageGroup(params: {
  areaKey?: string | null;
  stageKey?: string | null;
}): StageGroup | 'outros' {
  const areaKey = params.areaKey ? String(params.areaKey) : '';
  const stageKey = params.stageKey ? String(params.stageKey) : '';
  if (!areaKey || !stageKey) return 'outros';

  const board = AREA_BOARDS.find((b) => b.areaKey === (areaKey as AreaKey));
  const col = board?.columns?.find((c) => c.stageKey === stageKey);
  return col?.stageGroup || 'outros';
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Regras mínimas (conservadoras) de campos obrigatórios por etapa:
 * - fora de "demanda"/"lead_demanda": exigir descrição (evita cards vazios em execução)
 * - em produção/revisão/aprovação/entrega/finalizado: exigir responsável (assigned_to)
 */
export function requiredFieldsForStage(params: {
  areaKey?: string | null;
  stageKey?: string | null;
}): KanbanRequiredField[] {
  const stageKey = String(params.stageKey || '').trim();
  if (!stageKey) return [];

  const group = resolveStageGroup(params);
  const fields: KanbanRequiredField[] = [];

  // Regra de descrição: qualquer etapa fora do grupo "demanda" deve ter descrição
  // (isso cobre 'demanda' e também etapas equivalentes como 'inbox' quando aplicável)
  if (group !== 'demanda') {
    fields.push('description');
  }

  if (['producao', 'revisao_interna', 'aprovacao', 'publicacao_entrega', 'finalizado'].includes(group)) {
    fields.push('assigned_to');
  }

  return uniq(fields);
}

export function validateTaskAgainstRequiredFields(task: {
  description?: string | null | undefined;
  assigned_to?: string | null | undefined;
}, required: KanbanRequiredField[]): { ok: true } | { ok: false; missing: KanbanRequiredField[] } {
  const missing: KanbanRequiredField[] = [];
  for (const f of required) {
    if (f === 'description') {
      const d = String(task.description || '').trim();
      if (!d) missing.push('description');
    } else if (f === 'assigned_to') {
      const a = String(task.assigned_to || '').trim();
      if (!a) missing.push('assigned_to');
    }
  }
  if (missing.length) return { ok: false, missing: uniq(missing) };
  return { ok: true };
}

export function formatRequiredFieldsPtBr(fields: KanbanRequiredField[]) {
  const label = (f: KanbanRequiredField) => {
    if (f === 'description') return 'Descrição';
    if (f === 'assigned_to') return 'Responsável';
    return f;
  };
  return fields.map(label);
}


