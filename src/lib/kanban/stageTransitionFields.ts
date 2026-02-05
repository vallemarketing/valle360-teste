import type { PhaseField } from '@/lib/kanban/phaseFields';
import { AREA_SPECIFIC_FIELDS } from '@/lib/kanban/phaseFields';
import { resolveStageGroup } from '@/lib/kanban/requiredFields';

function uniqById(fields: PhaseField[]): PhaseField[] {
  const seen = new Set<string>();
  const out: PhaseField[] = [];
  for (const f of fields) {
    if (!f?.id) continue;
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
}

function areaKeyToLegacyAreaName(areaKey?: string | null): string | null {
  const k = String(areaKey || '').trim();
  if (!k) return null;
  switch (k) {
    case 'webdesigner':
      return 'Web Designer';
    case 'social_media':
      return 'Social Media';
    case 'trafego_pago':
      return 'Tráfego';
    case 'video_maker':
      return 'Video Maker';
    case 'designer_grafico':
      return 'Designer';
    case 'head_marketing':
      return 'Head Marketing';
    case 'comercial':
      return 'Comercial';
    case 'rh':
      return 'RH';
    case 'financeiro_pagar':
    case 'financeiro_receber':
      return 'Financeiro';
    default:
      return null;
  }
}

const BASE_FIELDS_BY_GROUP: Record<string, PhaseField[]> = {
  demanda: [
    { id: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Ex: Ajuste de Landing Page' },
    { id: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Contexto, objetivo, detalhes...' },
    { id: 'priority', label: 'Prioridade', type: 'select', options: [
      { value: 'low', label: '🟢 Baixa' },
      { value: 'medium', label: '🟡 Média' },
      { value: 'high', label: '🟠 Alta' },
      { value: 'urgent', label: '🔴 Urgente' },
    ]},
    { id: 'due_date', label: 'Data prevista', type: 'date' },
    { id: 'assigned_to', label: 'Responsável', type: 'select' },
  ],
  escopo: [
    { id: 'description', label: 'Escopo/Descrição', type: 'textarea', required: true, placeholder: 'Defina claramente o escopo...' },
    { id: 'briefing_link', label: 'Link do Briefing', type: 'url', placeholder: 'https://...' },
    { id: 'references', label: 'Referências', type: 'textarea', placeholder: 'Links e exemplos...' },
    { id: 'assigned_to', label: 'Responsável', type: 'select' },
    { id: 'due_date', label: 'Data prevista', type: 'date' },
  ],
  planejamento: [
    { id: 'assigned_to', label: 'Responsável', type: 'select', required: true },
    { id: 'started_at', label: 'Início', type: 'date' },
    { id: 'notes', label: 'Observações', type: 'textarea' },
  ],
  producao: [
    { id: 'assigned_to', label: 'Responsável', type: 'select', required: true },
    { id: 'due_date', label: 'Entrega prevista', type: 'date' },
    { id: 'notes', label: 'Observações', type: 'textarea' },
  ],
  revisao_interna: [
    { id: 'material_link', label: 'Link do Material', type: 'url', required: true, placeholder: 'Link do arquivo para revisão' },
    { id: 'checklist_quality', label: 'Checklist de Qualidade', type: 'multiselect', options: [
      { value: 'ortografia', label: 'Ortografia verificada' },
      { value: 'design', label: 'Design conforme briefing' },
      { value: 'responsivo', label: 'Responsivo/Adaptado' },
      { value: 'links', label: 'Links funcionando' },
      { value: 'imagens', label: 'Imagens otimizadas' },
    ]},
    { id: 'adjustment_points', label: 'Pontos de Ajuste', type: 'textarea' },
    { id: 'reviewer', label: 'Revisor', type: 'select' },
  ],
  aprovacao: [
    { id: 'client_link', label: 'Link enviado ao cliente', type: 'url', required: true },
    { id: 'sent_at', label: 'Data de envio', type: 'date' },
    { id: 'approval_status', label: 'Status da aprovação', type: 'select', options: [
      { value: 'pending', label: '⏳ Aguardando' },
      { value: 'approved', label: '✅ Aprovado' },
      { value: 'changes_requested', label: '🔄 Alterações solicitadas' },
      { value: 'rejected', label: '❌ Rejeitado' },
    ]},
    { id: 'client_feedback', label: 'Feedback do cliente', type: 'textarea' },
  ],
  ajustes: [
    { id: 'adjustment_points', label: 'Pontos de Ajuste', type: 'textarea', required: true, placeholder: 'Liste o que precisa ser ajustado...' },
    { id: 'material_link', label: 'Link do Material', type: 'url', placeholder: 'Link atualizado para revisão' },
  ],
  publicacao_entrega: [
    { id: 'publish_date', label: 'Data de publicação/entrega', type: 'date' },
    { id: 'publish_time', label: 'Horário', type: 'text', placeholder: 'Ex: 18:00' },
    { id: 'delivery_notes', label: 'Notas de entrega', type: 'textarea' },
  ],
  finalizado: [
    { id: 'completed_at', label: 'Data de conclusão', type: 'date', required: true },
    { id: 'final_files', label: 'Arquivos finais (link)', type: 'url', placeholder: 'https://...' },
    { id: 'delivery_notes', label: 'Notas finais', type: 'textarea' },
  ],
  bloqueado: [
    { id: 'block_reason', label: 'Motivo do bloqueio', type: 'textarea', required: true, placeholder: 'Explique o bloqueio e o que falta...' },
  ],
  outros: [
    { id: 'description', label: 'Descrição', type: 'textarea' },
  ],
};

export function getStageTransitionFields(params: {
  areaKey?: string | null;
  stageKey?: string | null;
}): PhaseField[] {
  const group = resolveStageGroup(params);
  const base = BASE_FIELDS_BY_GROUP[group] || BASE_FIELDS_BY_GROUP.outros;

  const legacyAreaName = areaKeyToLegacyAreaName(params.areaKey);
  const extras = legacyAreaName ? (AREA_SPECIFIC_FIELDS as any)[legacyAreaName] || [] : [];

  // Extras só fazem sentido no começo do fluxo (demanda/escopo/planejamento/producao)
  const includeExtras = ['demanda', 'escopo', 'planejamento', 'producao'].includes(group);
  const merged = includeExtras ? [...base, ...extras] : base;

  return uniqById(merged);
}




