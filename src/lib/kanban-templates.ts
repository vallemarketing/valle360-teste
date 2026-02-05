export const KANBAN_TEMPLATES = {
  web_designer: {
    columns: [
      { name: 'Briefing', color: '#6B7280' },
      { name: 'Pesquisa', color: '#3B82F6' },
      { name: 'Wireframe', color: '#8B5CF6' },
      { name: 'Design', color: '#EC4899' },
      { name: 'Revisão Interna', color: '#F59E0B' },
      { name: 'Aprovação Cliente', color: '#EF4444' },
      { name: 'Finalizado', color: '#10B981' }
    ]
  },
  designer: {
    columns: [
      { name: 'Backlog', color: '#6B7280' },
      { name: 'Em Criação', color: '#3B82F6' },
      { name: 'Ajustes', color: '#F59E0B' },
      { name: 'Aprovação', color: '#EF4444' },
      { name: 'Pronto', color: '#10B981' }
    ]
  },
  trafego: {
    columns: [
      { name: 'Planejamento', color: '#6B7280' },
      { name: 'Setup', color: '#3B82F6' },
      { name: 'Em Otimização', color: '#8B5CF6' },
      { name: 'Escala', color: '#EC4899' },
      { name: 'Pausado', color: '#EF4444' }
    ]
  },
  social_media: {
    columns: [
      { name: 'Ideias', color: '#6B7280' },
      { name: 'Copy', color: '#3B82F6' },
      { name: 'Arte/Design', color: '#8B5CF6' },
      { name: 'Agendamento', color: '#F59E0B' },
      { name: 'Publicado', color: '#10B981' }
    ]
  },
  comercial: {
    columns: [
      { name: 'Prospecção', color: '#6B7280' },
      { name: 'Qualificação', color: '#3B82F6' },
      { name: 'Proposta', color: '#8B5CF6' },
      { name: 'Negociação', color: '#F59E0B' },
      { name: 'Fechado', color: '#10B981' },
      { name: 'Perdido', color: '#EF4444' }
    ]
  },
  default: {
    columns: [
      { name: 'To Do', color: '#6B7280' },
      { name: 'Doing', color: '#3B82F6' },
      { name: 'Review', color: '#F59E0B' },
      { name: 'Done', color: '#10B981' }
    ]
  }
};

export const getTemplateForRole = (role: string) => {
  const normalizedRole = role.toLowerCase().replace(' ', '_');
  return KANBAN_TEMPLATES[normalizedRole as keyof typeof KANBAN_TEMPLATES] || KANBAN_TEMPLATES.default;
};



