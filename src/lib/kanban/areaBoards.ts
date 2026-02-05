/**
 * Kanban por área: fonte de verdade para criação de boards/colunas.
 * - `areaKey` é um slug estável (migrations, RLS, APIs e links)
 * - `columns` são as colunas reais do board (na ordem)
 */

export type AreaKey =
  | 'designer_grafico'
  | 'social_media'
  | 'head_marketing'
  | 'trafego_pago'
  | 'video_maker'
  | 'webdesigner'
  | 'copywriting'
  | 'comercial'
  | 'juridico'
  | 'contratos'
  | 'operacao'
  | 'notificacoes'
  | 'financeiro_pagar'
  | 'financeiro_receber'
  | 'rh';

/**
 * Agrupamento lógico para métricas/insights/IA.
 * Não precisa ser exclusivo nem único: serve para análises e stepper.
 */
export type StageGroup =
  | 'demanda'
  | 'escopo'
  | 'planejamento'
  | 'producao'
  | 'revisao_interna'
  | 'aprovacao'
  | 'ajustes'
  | 'publicacao_entrega'
  | 'finalizado'
  | 'bloqueado'
  | 'outros';

export type ColumnDefinition = {
  /** Nome visível na coluna */
  name: string;
  /** Ordem de exibição */
  position: number;
  /** Cor (hex) */
  color: string;
  /** Identificador estável por coluna (único dentro do board). */
  stageKey: string;
  /** Grupo lógico para métricas/insights */
  stageGroup: StageGroup;
  /** SLA (horas) opcional para alertas (ex.: aprovação do cliente 48h) */
  slaHours?: number;
  /** Limite WIP opcional */
  wipLimit?: number;
};

export type AreaBoardDefinition = {
  areaKey: AreaKey;
  label: string;
  description?: string;
  columns: ColumnDefinition[];
};

const C = {
  gray: '#6B7280',
  amber: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  green: '#10B981',
  red: '#EF4444',
  indigo: '#6366F1',
  teal: '#14B8A6',
  pink: '#EC4899',
};

export const AREA_BOARDS: AreaBoardDefinition[] = [
  {
    areaKey: 'designer_grafico',
    label: 'Designer Gráfico',
    description: 'Criação de peças e materiais visuais',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Produção', position: 3, color: C.blue, stageKey: 'producao', stageGroup: 'producao' },
      { name: 'Revisão Interna', position: 4, color: C.purple, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Envio para Aprovação', position: 5, color: C.indigo, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Ajustes', position: 6, color: C.pink, stageKey: 'ajustes', stageGroup: 'ajustes' },
      { name: 'Finalizado', position: 7, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 8, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'social_media',
    label: 'Social Media',
    description: 'Planejamento, produção e publicação de conteúdo',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Planejamento', position: 3, color: C.blue, stageKey: 'planejamento', stageGroup: 'planejamento' },
      { name: 'Produção', position: 4, color: C.purple, stageKey: 'producao', stageGroup: 'producao' },
      { name: 'Revisão Interna', position: 5, color: C.indigo, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 6, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Ajustes', position: 7, color: C.pink, stageKey: 'ajustes', stageGroup: 'ajustes' },
      { name: 'Agendamento/Publicação', position: 8, color: C.amber, stageKey: 'agendamento_publicacao', stageGroup: 'publicacao_entrega' },
      { name: 'Finalizado', position: 9, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 10, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'head_marketing',
    label: 'Head de Marketing',
    description: 'Estratégia, coordenação e alinhamento entre áreas',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda', wipLimit: 20 },
      { name: 'Diagnóstico', position: 2, color: C.amber, stageKey: 'diagnostico', stageGroup: 'escopo' },
      { name: 'Briefing/Escopo', position: 3, color: C.blue, stageKey: 'briefing_escopo', stageGroup: 'escopo' },
      { name: 'Estratégia', position: 4, color: C.purple, stageKey: 'estrategia', stageGroup: 'planejamento' },
      { name: 'Planejamento/Timeline', position: 5, color: C.indigo, stageKey: 'timeline', stageGroup: 'planejamento' },
      { name: 'Execução', position: 6, color: C.teal, stageKey: 'execucao', stageGroup: 'producao' },
      { name: 'Revisão Interna', position: 7, color: C.pink, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 8, color: C.amber, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Ajustes', position: 9, color: C.red, stageKey: 'ajustes', stageGroup: 'ajustes' },
      { name: 'Lançamento', position: 10, color: C.blue, stageKey: 'lancamento', stageGroup: 'publicacao_entrega' },
      { name: 'Otimização', position: 11, color: C.purple, stageKey: 'otimizacao', stageGroup: 'producao' },
      { name: 'Finalizado', position: 12, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 13, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'trafego_pago',
    label: 'Tráfego Pago',
    description: 'Performance: setup, campanhas, otimização e relatórios',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Setup/Tracking', position: 3, color: C.blue, stageKey: 'setup_tracking', stageGroup: 'planejamento' },
      { name: 'Criação de Campanhas', position: 4, color: C.purple, stageKey: 'criacao_campanhas', stageGroup: 'producao' },
      { name: 'Revisão/Checklist', position: 5, color: C.indigo, stageKey: 'revisao_checklist', stageGroup: 'revisao_interna' },
      { name: 'Publicação', position: 6, color: C.teal, stageKey: 'publicacao', stageGroup: 'publicacao_entrega' },
      { name: 'Otimização', position: 7, color: C.amber, stageKey: 'otimizacao', stageGroup: 'producao' },
      { name: 'Relatório', position: 8, color: C.blue, stageKey: 'relatorio', stageGroup: 'revisao_interna' },
      { name: 'Finalizado', position: 9, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 10, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'video_maker',
    label: 'Vídeo Maker / Editor',
    description: 'Edição e produção de vídeo',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Roteiro/Storyboard', position: 3, color: C.blue, stageKey: 'roteiro_storyboard', stageGroup: 'planejamento' },
      { name: 'Captação/Assets', position: 4, color: C.purple, stageKey: 'captacao_assets', stageGroup: 'producao' },
      { name: 'Edição', position: 5, color: C.indigo, stageKey: 'edicao', stageGroup: 'producao' },
      { name: 'Revisão Interna', position: 6, color: C.pink, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 7, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Ajustes', position: 8, color: C.amber, stageKey: 'ajustes', stageGroup: 'ajustes' },
      { name: 'Finalizado', position: 9, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 10, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'webdesigner',
    label: 'Webdesigner',
    description: 'Landing pages, sites e ajustes',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Wireframe/Estrutura', position: 3, color: C.blue, stageKey: 'wireframe_estrutura', stageGroup: 'planejamento' },
      { name: 'Design (Figma)', position: 4, color: C.purple, stageKey: 'design_figma', stageGroup: 'producao' },
      { name: 'Implementação', position: 5, color: C.indigo, stageKey: 'implementacao', stageGroup: 'producao' },
      { name: 'SEO/Tracking/Integrações', position: 6, color: C.teal, stageKey: 'seo_tracking_integracoes', stageGroup: 'revisao_interna' },
      { name: 'Revisão Interna', position: 7, color: C.pink, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Envio para Aprovação', position: 8, color: C.amber, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Ajustes Pós-Aprovação', position: 9, color: C.purple, stageKey: 'ajustes_pos_aprovacao', stageGroup: 'ajustes' },
      { name: 'Publicação', position: 10, color: C.blue, stageKey: 'publicacao', stageGroup: 'publicacao_entrega' },
      { name: 'Finalizado', position: 11, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 12, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'copywriting',
    label: 'Copywriting',
    description: 'Copy, redação e revisão',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Pesquisa', position: 3, color: C.blue, stageKey: 'pesquisa', stageGroup: 'planejamento' },
      { name: 'Escrita', position: 4, color: C.purple, stageKey: 'escrita', stageGroup: 'producao' },
      { name: 'Revisão Interna', position: 5, color: C.indigo, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 6, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Finalizado', position: 7, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 8, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'comercial',
    label: 'Comercial (Vendas)',
    description: 'Leads, propostas e fechamento',
    columns: [
      { name: 'Lead/Demanda', position: 1, color: C.gray, stageKey: 'lead_demanda', stageGroup: 'demanda' },
      { name: 'Qualificação', position: 2, color: C.amber, stageKey: 'qualificacao', stageGroup: 'escopo' },
      { name: 'Proposta', position: 3, color: C.blue, stageKey: 'proposta', stageGroup: 'producao' },
      { name: 'Negociação', position: 4, color: C.purple, stageKey: 'negociacao', stageGroup: 'producao' },
      { name: 'Fechamento', position: 5, color: C.indigo, stageKey: 'fechamento', stageGroup: 'publicacao_entrega' },
      { name: 'Handoff (Passagem)', position: 6, color: C.teal, stageKey: 'handoff_passagem', stageGroup: 'publicacao_entrega' },
      { name: 'Finalizado', position: 7, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 8, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'juridico',
    label: 'Jurídico',
    description: 'Análises e validações jurídicas',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Produção', position: 3, color: C.blue, stageKey: 'producao', stageGroup: 'producao' },
      { name: 'Revisão Interna', position: 4, color: C.purple, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 5, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Ajustes', position: 6, color: C.pink, stageKey: 'ajustes', stageGroup: 'ajustes' },
      { name: 'Finalizado', position: 7, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 8, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'contratos',
    label: 'Contratos',
    description: 'Minutas, revisão e assinatura',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Elaboração', position: 3, color: C.blue, stageKey: 'elaboracao', stageGroup: 'producao' },
      { name: 'Revisão Interna', position: 4, color: C.purple, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 5, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Ajustes', position: 6, color: C.pink, stageKey: 'ajustes', stageGroup: 'ajustes' },
      { name: 'Finalizado', position: 7, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 8, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'financeiro_pagar',
    label: 'Financeiro (Contas a Pagar)',
    description: 'Processos de contas a pagar',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Processamento', position: 3, color: C.blue, stageKey: 'processamento', stageGroup: 'producao' },
      { name: 'Validação', position: 4, color: C.purple, stageKey: 'validacao', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 5, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Finalizado', position: 6, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 7, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'financeiro_receber',
    label: 'Financeiro (Contas a Receber)',
    description: 'Cobrança e contas a receber',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Escopo', position: 2, color: C.amber, stageKey: 'escopo', stageGroup: 'escopo' },
      { name: 'Processamento', position: 3, color: C.blue, stageKey: 'processamento', stageGroup: 'producao' },
      { name: 'Validação', position: 4, color: C.purple, stageKey: 'validacao', stageGroup: 'revisao_interna' },
      { name: 'Aprovação', position: 5, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Finalizado', position: 6, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 7, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'operacao',
    label: 'Operação',
    description: 'Execução operacional e entregas',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Execução', position: 2, color: C.blue, stageKey: 'execucao', stageGroup: 'producao' },
      { name: 'Revisão', position: 3, color: C.purple, stageKey: 'revisao_interna', stageGroup: 'revisao_interna' },
      { name: 'Finalizado', position: 4, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 5, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'notificacoes',
    label: 'Notificações',
    description: 'Mensageria e comunicações',
    columns: [
      { name: 'Inbox', position: 1, color: C.gray, stageKey: 'inbox', stageGroup: 'demanda' },
      { name: 'Preparar', position: 2, color: C.amber, stageKey: 'preparar', stageGroup: 'producao' },
      { name: 'Enviar', position: 3, color: C.blue, stageKey: 'enviar', stageGroup: 'publicacao_entrega' },
      { name: 'Finalizado', position: 4, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 5, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
  {
    areaKey: 'rh',
    label: 'RH',
    description: 'Solicitações e rotinas de RH',
    columns: [
      { name: 'Demanda', position: 1, color: C.gray, stageKey: 'demanda', stageGroup: 'demanda' },
      { name: 'Análise', position: 2, color: C.amber, stageKey: 'analise', stageGroup: 'escopo' },
      { name: 'Aprovação', position: 3, color: C.teal, stageKey: 'aprovacao', stageGroup: 'aprovacao', slaHours: 48 },
      { name: 'Finalizado', position: 4, color: C.green, stageKey: 'finalizado', stageGroup: 'finalizado' },
      { name: 'Bloqueado', position: 5, color: C.red, stageKey: 'bloqueado', stageGroup: 'bloqueado' },
    ],
  },
];

export const AREA_BOARD_BY_KEY: Record<AreaKey, AreaBoardDefinition> = AREA_BOARDS.reduce((acc, b) => {
  acc[b.areaKey] = b;
  return acc;
}, {} as Record<AreaKey, AreaBoardDefinition>);

export function getAreaBoard(areaKey: AreaKey): AreaBoardDefinition {
  const found = AREA_BOARD_BY_KEY[areaKey];
  if (!found) throw new Error(`Área não suportada: ${areaKey}`);
  return found;
}

export function listAreaKeys(): AreaKey[] {
  return AREA_BOARDS.map((b) => b.areaKey);
}

export function normalizeAreaText(input: string) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function inferAreaKeyFromLabel(label: string | null | undefined): AreaKey | null {
  if (!label) return null;
  const s = normalizeAreaText(String(label));

  if (s.includes('head') || (s.includes('marketing') && (s.includes('estrateg') || s.includes('coord')))) return 'head_marketing';
  if (s.includes('social')) return 'social_media';
  if (s.includes('trafego') || s.includes('performance') || s.includes('ads')) return 'trafego_pago';
  if (s.includes('video') || s.includes('editor')) return 'video_maker';
  if (s.includes('web')) return 'webdesigner';
  if (s.includes('copy')) return 'copywriting';
  if (s.includes('designer') || s.includes('design graf')) return 'designer_grafico';

  if (s.includes('jurid')) return 'juridico';
  if (s.includes('contrat')) return 'contratos';
  if (s.includes('comercial') || s.includes('vendas')) return 'comercial';

  if (s.includes('finance') && (s.includes('pagar') || s.includes('contas a pagar'))) return 'financeiro_pagar';
  if (s.includes('finance') && (s.includes('receber') || s.includes('contas a receber'))) return 'financeiro_receber';
  if (s.includes('finance')) return 'financeiro_receber';

  if (s.includes('operac')) return 'operacao';
  if (s.includes('notific')) return 'notificacoes';
  if (s === 'rh' || s.includes('recursos humanos') || s.includes('people') || s.includes('pessoas')) return 'rh';

  return null;
}

/**
 * Best-effort: mapeia `employees.department`, `employees.area_of_expertise` e `employees.areas[]` para `AreaKey`.
 */
export function inferAreaKeyFromEmployee(params: {
  department?: string | null;
  area_of_expertise?: string | null;
  areas?: string[] | null;
}): AreaKey | null {
  const parts: string[] = [];
  if (params.department) parts.push(params.department);
  if (params.area_of_expertise) parts.push(params.area_of_expertise);
  if (Array.isArray(params.areas)) parts.push(...params.areas);
  return inferAreaKeyFromLabel(parts.join(' '));
}

/**
 * Mapeia o `serviceType` do formulário do cliente (`/cliente/solicitacao`) para `AreaKey` (decisão: direto para a área).
 */
export function mapClientServiceTypeToAreaKey(serviceType: string): AreaKey {
  const s = normalizeAreaText(serviceType);
  if (s === 'design' || s.includes('design')) return 'designer_grafico';
  if (s === 'web' || s.includes('web')) return 'webdesigner';
  if (s === 'video' || s.includes('video') || s.includes('motion')) return 'video_maker';
  if (s === 'social' || s.includes('social')) return 'social_media';
  if (s === 'trafego' || s.includes('ads') || s.includes('trafego')) return 'trafego_pago';
  if (s === 'marketing' || s === 'outro') return 'head_marketing';
  return 'head_marketing';
}
