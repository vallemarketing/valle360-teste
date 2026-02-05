// Configuração de colunas do Kanban por área

export interface KanbanColumn {
  id: string
  title: string
  color: string
  wipLimit?: number
}

export const columnsByArea: Record<string, KanbanColumn[]> = {
  // DESIGNER
  'Designer': [
    { id: 'briefing', title: 'Briefing', color: '#7B68EE' },
    { id: 'em_criacao', title: 'Em Criação', color: '#F59E0B' },
    { id: 'revisao', title: 'Revisão', color: '#3B82F6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#8B5CF6' },
    { id: 'enviado', title: 'Enviado', color: '#10B981' }
  ],
  'Design Gráfico': [
    { id: 'briefing', title: 'Briefing', color: '#7B68EE' },
    { id: 'em_criacao', title: 'Em Criação', color: '#F59E0B' },
    { id: 'revisao', title: 'Revisão', color: '#3B82F6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#8B5CF6' },
    { id: 'enviado', title: 'Enviado', color: '#10B981' }
  ],
  'Designer Gráfico': [
    { id: 'briefing', title: 'Briefing', color: '#7B68EE' },
    { id: 'em_criacao', title: 'Em Criação', color: '#F59E0B' },
    { id: 'revisao', title: 'Revisão', color: '#3B82F6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#8B5CF6' },
    { id: 'enviado', title: 'Enviado', color: '#10B981' }
  ],

  // SOCIAL MEDIA
  'Social Media': [
    { id: 'planejamento', title: 'Planejamento', color: '#6B7280' },
    { id: 'criacao', title: 'Criação', color: '#F59E0B' },
    { id: 'aprovacao_interna', title: 'Aprovação Interna', color: '#3B82F6' },
    { id: 'agendado', title: 'Agendado', color: '#8B5CF6' },
    { id: 'publicado', title: 'Publicado', color: '#10B981' }
  ],

  // VIDEOMAKER
  'Videomaker': [
    { id: 'briefing', title: 'Briefing', color: '#6B7280' },
    { id: 'pre_producao', title: 'Pré-Produção', color: '#F59E0B' },
    { id: 'gravacao', title: 'Gravação', color: '#FF0000' },
    { id: 'edicao', title: 'Edição', color: '#3B82F6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#8B5CF6' },
    { id: 'entregue', title: 'Entregue', color: '#10B981' }
  ],
  'Video Maker': [
    { id: 'briefing', title: 'Briefing', color: '#6B7280' },
    { id: 'pre_producao', title: 'Pré-Produção', color: '#F59E0B' },
    { id: 'gravacao', title: 'Gravação', color: '#FF0000' },
    { id: 'edicao', title: 'Edição', color: '#3B82F6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#8B5CF6' },
    { id: 'entregue', title: 'Entregue', color: '#10B981' }
  ],
  'Editor de Vídeo': [
    { id: 'briefing', title: 'Briefing', color: '#6B7280' },
    { id: 'pre_producao', title: 'Pré-Produção', color: '#F59E0B' },
    { id: 'gravacao', title: 'Gravação', color: '#FF0000' },
    { id: 'edicao', title: 'Edição', color: '#3B82F6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#8B5CF6' },
    { id: 'entregue', title: 'Entregue', color: '#10B981' }
  ],
  'Vídeo': [
    { id: 'briefing', title: 'Briefing', color: '#6B7280' },
    { id: 'pre_producao', title: 'Pré-Produção', color: '#F59E0B' },
    { id: 'gravacao', title: 'Gravação', color: '#FF0000' },
    { id: 'edicao', title: 'Edição', color: '#3B82F6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#8B5CF6' },
    { id: 'entregue', title: 'Entregue', color: '#10B981' }
  ],

  // WEB DESIGNER
  'Web Designer': [
    { id: 'briefing', title: 'Briefing', color: '#6B7280' },
    { id: 'desenvolvimento', title: 'Desenvolvimento', color: '#F59E0B' },
    { id: 'revisao', title: 'Revisão', color: '#3B82F6' },
    { id: 'homologacao', title: 'Homologação', color: '#8B5CF6' },
    { id: 'deploy', title: 'Deploy', color: '#10B981' },
    { id: 'suporte', title: 'Suporte', color: '#6366F1' }
  ],
  'Webdesigner': [
    { id: 'briefing', title: 'Briefing', color: '#6B7280' },
    { id: 'desenvolvimento', title: 'Desenvolvimento', color: '#F59E0B' },
    { id: 'revisao', title: 'Revisão', color: '#3B82F6' },
    { id: 'homologacao', title: 'Homologação', color: '#8B5CF6' },
    { id: 'deploy', title: 'Deploy', color: '#10B981' },
    { id: 'suporte', title: 'Suporte', color: '#6366F1' }
  ],

  // COMERCIAL
  'Comercial': [
    { id: 'lead', title: 'Lead', color: '#6B7280' },
    { id: 'qualificado', title: 'Qualificado', color: '#3B82F6' },
    { id: 'proposta', title: 'Proposta', color: '#F59E0B' },
    { id: 'negociacao', title: 'Negociação', color: '#8B5CF6' },
    { id: 'ganho', title: 'Ganho', color: '#10B981' }
  ],

  // TRÁFEGO PAGO
  'Tráfego Pago': [
    { id: 'planejamento', title: 'Planejamento', color: '#6B7280' },
    { id: 'criacao', title: 'Criação', color: '#F59E0B' },
    { id: 'aprovacao', title: 'Aprovação', color: '#3B82F6' },
    { id: 'ativo', title: 'Ativo', color: '#10B981' },
    { id: 'otimizacao', title: 'Otimização', color: '#8B5CF6' },
    { id: 'pausado', title: 'Pausado', color: '#EF4444' }
  ],
  'Trafego Pago': [
    { id: 'planejamento', title: 'Planejamento', color: '#6B7280' },
    { id: 'criacao', title: 'Criação', color: '#F59E0B' },
    { id: 'aprovacao', title: 'Aprovação', color: '#3B82F6' },
    { id: 'ativo', title: 'Ativo', color: '#10B981' },
    { id: 'otimizacao', title: 'Otimização', color: '#8B5CF6' },
    { id: 'pausado', title: 'Pausado', color: '#EF4444' }
  ],

  // RH
  'RH': [
    { id: 'solicitacao', title: 'Solicitação', color: '#6B7280' },
    { id: 'analise', title: 'Análise', color: '#F59E0B' },
    { id: 'aprovacao_gestor', title: 'Aprovação Gestor', color: '#3B82F6' },
    { id: 'aprovacao_rh', title: 'Aprovação RH', color: '#8B5CF6' },
    { id: 'concluido', title: 'Concluído', color: '#10B981' }
  ],
  'Recursos Humanos': [
    { id: 'solicitacao', title: 'Solicitação', color: '#6B7280' },
    { id: 'analise', title: 'Análise', color: '#F59E0B' },
    { id: 'aprovacao_gestor', title: 'Aprovação Gestor', color: '#3B82F6' },
    { id: 'aprovacao_rh', title: 'Aprovação RH', color: '#8B5CF6' },
    { id: 'concluido', title: 'Concluído', color: '#10B981' }
  ],
  'HR': [
    { id: 'solicitacao', title: 'Solicitação', color: '#6B7280' },
    { id: 'analise', title: 'Análise', color: '#F59E0B' },
    { id: 'aprovacao_gestor', title: 'Aprovação Gestor', color: '#3B82F6' },
    { id: 'aprovacao_rh', title: 'Aprovação RH', color: '#8B5CF6' },
    { id: 'concluido', title: 'Concluído', color: '#10B981' }
  ],

  // FINANCEIRO
  'Financeiro': [
    { id: 'pendente', title: 'Pendente', color: '#6B7280' },
    { id: 'em_analise', title: 'Em Análise', color: '#F59E0B' },
    { id: 'aprovado', title: 'Aprovado', color: '#3B82F6' },
    { id: 'processado', title: 'Processado', color: '#8B5CF6' },
    { id: 'pago', title: 'Pago', color: '#10B981' }
  ],
  'Finanças': [
    { id: 'pendente', title: 'Pendente', color: '#6B7280' },
    { id: 'em_analise', title: 'Em Análise', color: '#F59E0B' },
    { id: 'aprovado', title: 'Aprovado', color: '#3B82F6' },
    { id: 'processado', title: 'Processado', color: '#8B5CF6' },
    { id: 'pago', title: 'Pago', color: '#10B981' }
  ],
  'Finance': [
    { id: 'pendente', title: 'Pendente', color: '#6B7280' },
    { id: 'em_analise', title: 'Em Análise', color: '#F59E0B' },
    { id: 'aprovado', title: 'Aprovado', color: '#3B82F6' },
    { id: 'processado', title: 'Processado', color: '#8B5CF6' },
    { id: 'pago', title: 'Pago', color: '#10B981' }
  ],

  // HEAD DE MARKETING
  'Head de Marketing': [
    { id: 'backlog', title: 'Backlog', color: '#6B7280' },
    { id: 'planejamento', title: 'Planejamento', color: '#F59E0B' },
    { id: 'em_execucao', title: 'Em Execução', color: '#3B82F6' },
    { id: 'revisao', title: 'Revisão', color: '#8B5CF6' },
    { id: 'concluido', title: 'Concluído', color: '#10B981' }
  ],
  'Head Marketing': [
    { id: 'backlog', title: 'Backlog', color: '#6B7280' },
    { id: 'planejamento', title: 'Planejamento', color: '#F59E0B' },
    { id: 'em_execucao', title: 'Em Execução', color: '#3B82F6' },
    { id: 'revisao', title: 'Revisão', color: '#8B5CF6' },
    { id: 'concluido', title: 'Concluído', color: '#10B981' }
  ],
  'Head de Mkt': [
    { id: 'backlog', title: 'Backlog', color: '#6B7280' },
    { id: 'planejamento', title: 'Planejamento', color: '#F59E0B' },
    { id: 'em_execucao', title: 'Em Execução', color: '#3B82F6' },
    { id: 'revisao', title: 'Revisão', color: '#8B5CF6' },
    { id: 'concluido', title: 'Concluído', color: '#10B981' }
  ],
  'Head Mkt': [
    { id: 'backlog', title: 'Backlog', color: '#6B7280' },
    { id: 'planejamento', title: 'Planejamento', color: '#F59E0B' },
    { id: 'em_execucao', title: 'Em Execução', color: '#3B82F6' },
    { id: 'revisao', title: 'Revisão', color: '#8B5CF6' },
    { id: 'concluido', title: 'Concluído', color: '#10B981' }
  ],

  // COPYWRITER
  'Copywriter': [
    { id: 'briefing', title: 'Briefing', color: '#6B7280' },
    { id: 'pesquisa', title: 'Pesquisa', color: '#F59E0B' },
    { id: 'escrita', title: 'Escrita', color: '#3B82F6' },
    { id: 'revisao', title: 'Revisão', color: '#8B5CF6' },
    { id: 'aprovacao', title: 'Aprovação', color: '#10B981' },
    { id: 'publicado', title: 'Publicado', color: '#6366F1' }
  ]
}

// Função para obter colunas por área
export function getColumnsByArea(area: string): KanbanColumn[] {
  return columnsByArea[area] || [
    { id: 'backlog', title: 'Backlog', color: '#6B7280' },
    { id: 'todo', title: 'A Fazer', color: '#F59E0B' },
    { id: 'in_progress', title: 'Em Progresso', color: '#3B82F6' },
    { id: 'review', title: 'Revisão', color: '#8B5CF6' },
    { id: 'done', title: 'Concluído', color: '#10B981' }
  ]
}

// Lista de todas as áreas disponíveis
export const availableAreas = Object.keys(columnsByArea)


