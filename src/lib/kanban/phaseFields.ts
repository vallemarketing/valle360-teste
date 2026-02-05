// Configuração de campos por fase e área para o Kanban estilo Pipefy

export interface PhaseField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'number' | 'checkbox' | 'url' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
}

export interface PhaseConfig {
  id: string;
  title: string;
  color: string;
  fields: PhaseField[];
}

export interface AreaConfig {
  id: string;
  name: string;
  phases: PhaseConfig[];
  specificFields: PhaseField[];
}

// ==================== CAMPOS COMUNS POR FASE ====================

export const COMMON_PHASE_FIELDS: Record<string, PhaseField[]> = {
  demandas: [
    { id: 'title', label: 'Título da Demanda', type: 'text', required: true, placeholder: 'Ex: Criação de Landing Page' },
    { id: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descreva os detalhes da demanda...' },
    { id: 'client_id', label: 'Cliente', type: 'select', required: true, placeholder: 'Selecione o cliente' },
    { id: 'priority', label: 'Prioridade', type: 'select', required: true, options: [
      { value: 'low', label: '🟢 Baixa' },
      { value: 'medium', label: '🟡 Média' },
      { value: 'high', label: '🟠 Alta' },
      { value: 'urgent', label: '🔴 Urgente' }
    ]},
    { id: 'due_date', label: 'Data de Entrega Prevista', type: 'date', required: true },
  ],
  em_progresso: [
    { id: 'briefing_link', label: 'Link do Briefing', type: 'url', placeholder: 'https://...' },
    { id: 'references', label: 'Referências de Site', type: 'textarea', placeholder: 'Links ou descrição das referências...' },
    { id: 'assigned_to', label: 'Responsável', type: 'select', required: true },
    { id: 'started_at', label: 'Data de Início', type: 'date' },
    { id: 'notes', label: 'Observações', type: 'textarea', placeholder: 'Anotações sobre o andamento...' },
  ],
  revisao: [
    { id: 'material_link', label: 'Link do Material', type: 'url', required: true, placeholder: 'Link do arquivo para revisão' },
    { id: 'checklist_quality', label: 'Checklist de Qualidade', type: 'multiselect', options: [
      { value: 'ortografia', label: 'Ortografia verificada' },
      { value: 'design', label: 'Design conforme briefing' },
      { value: 'responsivo', label: 'Responsivo/Adaptado' },
      { value: 'links', label: 'Links funcionando' },
      { value: 'imagens', label: 'Imagens otimizadas' },
    ]},
    { id: 'adjustment_points', label: 'Pontos de Ajuste', type: 'textarea', placeholder: 'Liste os pontos que precisam de ajuste...' },
    { id: 'reviewer', label: 'Revisor', type: 'select' },
  ],
  aprovacao: [
    { id: 'client_link', label: 'Link Enviado ao Cliente', type: 'url', required: true },
    { id: 'sent_at', label: 'Data de Envio', type: 'date' },
    { id: 'approval_status', label: 'Status da Aprovação', type: 'select', options: [
      { value: 'pending', label: '⏳ Aguardando' },
      { value: 'approved', label: '✅ Aprovado' },
      { value: 'changes_requested', label: '🔄 Alterações Solicitadas' },
      { value: 'rejected', label: '❌ Rejeitado' },
    ]},
    { id: 'client_feedback', label: 'Feedback do Cliente', type: 'textarea', placeholder: 'Comentários do cliente...' },
  ],
  concluido: [
    { id: 'completed_at', label: 'Data de Conclusão', type: 'date', required: true },
    { id: 'final_files', label: 'Arquivos Finais', type: 'url', placeholder: 'Link para os arquivos finais' },
    { id: 'delivery_notes', label: 'Notas de Entrega', type: 'textarea' },
    { id: 'client_satisfaction', label: 'Satisfação do Cliente', type: 'select', options: [
      { value: '5', label: '⭐⭐⭐⭐⭐ Excelente' },
      { value: '4', label: '⭐⭐⭐⭐ Bom' },
      { value: '3', label: '⭐⭐⭐ Regular' },
      { value: '2', label: '⭐⭐ Ruim' },
      { value: '1', label: '⭐ Péssimo' },
    ]},
  ],
};

// ==================== CAMPOS ESPECÍFICOS POR ÁREA ====================

export const AREA_SPECIFIC_FIELDS: Record<string, PhaseField[]> = {
  'Web Designer': [
    { id: 'site_type', label: 'Tipo de Site', type: 'select', options: [
      { value: 'landing', label: 'Landing Page' },
      { value: 'institutional', label: 'Institucional' },
      { value: 'ecommerce', label: 'E-commerce' },
      { value: 'blog', label: 'Blog' },
      { value: 'portfolio', label: 'Portfólio' },
      { value: 'webapp', label: 'Web App' },
    ]},
    { id: 'pages_count', label: 'Quantidade de Páginas', type: 'number', placeholder: 'Ex: 5' },
    { id: 'functionalities', label: 'Funcionalidades', type: 'multiselect', options: [
      { value: 'form', label: 'Formulário de Contato' },
      { value: 'chat', label: 'Chat/WhatsApp' },
      { value: 'gallery', label: 'Galeria de Fotos' },
      { value: 'blog', label: 'Blog Integrado' },
      { value: 'payment', label: 'Pagamento Online' },
      { value: 'login', label: 'Área de Login' },
    ]},
    { id: 'has_domain', label: 'Tem domínio?', type: 'checkbox' },
    { id: 'has_hosting', label: 'Tem hospedagem?', type: 'checkbox' },
  ],

  'Social Media': [
    { id: 'platforms', label: 'Plataformas', type: 'multiselect', required: true, options: [
      { value: 'instagram', label: 'Instagram' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'tiktok', label: 'TikTok' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'twitter', label: 'Twitter/X' },
    ]},
    { id: 'content_format', label: 'Formato', type: 'multiselect', options: [
      { value: 'reels', label: 'Reels' },
      { value: 'carousel', label: 'Carrossel' },
      { value: 'stories', label: 'Stories' },
      { value: 'feed', label: 'Post Feed' },
      { value: 'video_long', label: 'Vídeo Longo' },
      { value: 'live', label: 'Live' },
    ]},
    { id: 'publish_date', label: 'Data de Publicação', type: 'date' },
    { id: 'publish_time', label: 'Horário de Publicação', type: 'text', placeholder: 'Ex: 18:00' },
    { id: 'caption', label: 'Legenda/Copy', type: 'textarea' },
  ],

  'Tráfego': [
    { id: 'ads_platform', label: 'Plataforma de Ads', type: 'multiselect', required: true, options: [
      { value: 'google', label: 'Google Ads' },
      { value: 'meta', label: 'Meta Ads (Facebook/Instagram)' },
      { value: 'tiktok', label: 'TikTok Ads' },
      { value: 'linkedin', label: 'LinkedIn Ads' },
      { value: 'youtube', label: 'YouTube Ads' },
    ]},
    { id: 'budget', label: 'Orçamento (R$)', type: 'number', placeholder: 'Ex: 5000' },
    { id: 'objective', label: 'Objetivo', type: 'select', options: [
      { value: 'awareness', label: 'Reconhecimento' },
      { value: 'traffic', label: 'Tráfego' },
      { value: 'engagement', label: 'Engajamento' },
      { value: 'leads', label: 'Geração de Leads' },
      { value: 'conversions', label: 'Conversões' },
      { value: 'sales', label: 'Vendas' },
    ]},
    { id: 'target_audience', label: 'Público-Alvo', type: 'textarea', placeholder: 'Descreva o público-alvo...' },
    { id: 'campaign_period', label: 'Período da Campanha', type: 'text', placeholder: 'Ex: 01/01 a 31/01' },
  ],

  'Video Maker': [
    { id: 'video_duration', label: 'Duração', type: 'select', options: [
      { value: '15s', label: 'Até 15 segundos' },
      { value: '30s', label: '30 segundos' },
      { value: '60s', label: '1 minuto' },
      { value: '3min', label: 'Até 3 minutos' },
      { value: '5min', label: 'Até 5 minutos' },
      { value: '10min+', label: 'Mais de 10 minutos' },
    ]},
    { id: 'video_format', label: 'Formato', type: 'select', options: [
      { value: 'vertical', label: 'Vertical (9:16)' },
      { value: 'horizontal', label: 'Horizontal (16:9)' },
      { value: 'square', label: 'Quadrado (1:1)' },
    ]},
    { id: 'has_soundtrack', label: 'Trilha Sonora', type: 'checkbox' },
    { id: 'has_subtitles', label: 'Legendas', type: 'checkbox' },
    { id: 'resolution', label: 'Resolução', type: 'select', options: [
      { value: 'hd', label: 'HD (720p)' },
      { value: 'fullhd', label: 'Full HD (1080p)' },
      { value: '4k', label: '4K' },
    ]},
    { id: 'style', label: 'Estilo do Vídeo', type: 'text', placeholder: 'Ex: Motion Graphics, Filmagem, etc.' },
  ],

  'Designer': [
    { id: 'art_type', label: 'Tipo de Arte', type: 'select', options: [
      { value: 'social', label: 'Post para Redes Sociais' },
      { value: 'banner', label: 'Banner' },
      { value: 'logo', label: 'Logo/Identidade Visual' },
      { value: 'flyer', label: 'Flyer/Panfleto' },
      { value: 'presentation', label: 'Apresentação' },
      { value: 'ebook', label: 'E-book/Material Rico' },
      { value: 'packaging', label: 'Embalagem' },
    ]},
    { id: 'dimensions', label: 'Dimensões', type: 'text', placeholder: 'Ex: 1080x1080px' },
    { id: 'file_format', label: 'Formato de Arquivo', type: 'multiselect', options: [
      { value: 'png', label: 'PNG' },
      { value: 'jpg', label: 'JPG' },
      { value: 'pdf', label: 'PDF' },
      { value: 'psd', label: 'PSD (Editável)' },
      { value: 'ai', label: 'AI (Editável)' },
      { value: 'svg', label: 'SVG' },
    ]},
    { id: 'color_palette', label: 'Paleta de Cores', type: 'text', placeholder: 'Cores principais...' },
  ],

  'Head Marketing': [
    { id: 'campaign_name', label: 'Nome da Campanha', type: 'text', required: true },
    { id: 'campaign_type', label: 'Tipo de Campanha', type: 'select', options: [
      { value: 'launch', label: 'Lançamento' },
      { value: 'seasonal', label: 'Sazonal' },
      { value: 'institutional', label: 'Institucional' },
      { value: 'promotion', label: 'Promoção' },
      { value: 'branding', label: 'Branding' },
    ]},
    { id: 'teams_involved', label: 'Equipes Envolvidas', type: 'multiselect', options: [
      { value: 'social', label: 'Social Media' },
      { value: 'design', label: 'Design' },
      { value: 'video', label: 'Video Maker' },
      { value: 'trafego', label: 'Tráfego' },
      { value: 'web', label: 'Web Designer' },
    ]},
    { id: 'total_budget', label: 'Orçamento Total', type: 'number' },
    { id: 'expected_results', label: 'Resultados Esperados', type: 'textarea' },
  ],

  'Comercial': [
    { id: 'proposal_value', label: 'Valor da Proposta (R$)', type: 'number', required: true },
    { id: 'services_included', label: 'Serviços Inclusos', type: 'multiselect', options: [
      { value: 'social', label: 'Gestão de Redes Sociais' },
      { value: 'trafego', label: 'Tráfego Pago' },
      { value: 'site', label: 'Criação de Site' },
      { value: 'design', label: 'Design Gráfico' },
      { value: 'video', label: 'Produção de Vídeo' },
      { value: 'consultoria', label: 'Consultoria' },
    ]},
    { id: 'contract_duration', label: 'Duração do Contrato', type: 'select', options: [
      { value: '3', label: '3 meses' },
      { value: '6', label: '6 meses' },
      { value: '12', label: '12 meses' },
      { value: 'project', label: 'Por Projeto' },
    ]},
    { id: 'payment_conditions', label: 'Condições de Pagamento', type: 'text' },
    { id: 'decision_maker', label: 'Decisor', type: 'text' },
  ],

  'RH': [
    { id: 'job_title', label: 'Cargo/Vaga', type: 'text', required: true },
    { id: 'candidate_name', label: 'Nome do Candidato', type: 'text' },
    { id: 'selection_stage', label: 'Etapa da Seleção', type: 'select', options: [
      { value: 'screening', label: 'Triagem de Currículo' },
      { value: 'interview1', label: 'Primeira Entrevista' },
      { value: 'technical', label: 'Teste Técnico' },
      { value: 'interview2', label: 'Entrevista Final' },
      { value: 'offer', label: 'Proposta' },
      { value: 'hired', label: 'Contratado' },
    ]},
    { id: 'salary_range', label: 'Faixa Salarial', type: 'text', placeholder: 'Ex: R$ 3.000 - R$ 4.000' },
    { id: 'benefits', label: 'Benefícios', type: 'textarea' },
    { id: 'start_date', label: 'Previsão de Início', type: 'date' },
  ],

  'Financeiro': [
    { id: 'document_type', label: 'Tipo de Documento', type: 'select', options: [
      { value: 'invoice', label: 'Nota Fiscal' },
      { value: 'boleto', label: 'Boleto' },
      { value: 'receipt', label: 'Recibo' },
      { value: 'contract', label: 'Contrato' },
    ]},
    { id: 'value', label: 'Valor (R$)', type: 'number', required: true },
    { id: 'due_date', label: 'Vencimento', type: 'date', required: true },
    { id: 'category', label: 'Categoria', type: 'select', options: [
      { value: 'servicos', label: 'Serviços' },
      { value: 'software', label: 'Software/Assinaturas' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'pessoal', label: 'Pessoal' },
      { value: 'infraestrutura', label: 'Infraestrutura' },
    ]},
  ],
};

// ==================== CONFIGURAÇÃO DE FASES POR ÁREA ====================

export const KANBAN_PHASES: Record<string, PhaseConfig[]> = {
  default: [
    { id: 'demandas', title: 'Demandas', color: '#6366f1', fields: COMMON_PHASE_FIELDS.demandas },
    { id: 'em_progresso', title: 'Em Progresso', color: '#f97316', fields: COMMON_PHASE_FIELDS.em_progresso },
    { id: 'revisao', title: 'Revisão', color: '#eab308', fields: COMMON_PHASE_FIELDS.revisao },
    { id: 'aprovacao', title: 'Aprovação Cliente', color: '#06b6d4', fields: COMMON_PHASE_FIELDS.aprovacao },
    { id: 'concluido', title: 'Concluído', color: '#10b981', fields: COMMON_PHASE_FIELDS.concluido },
  ],
  contas_pagar: [
    { id: 'pendente', title: 'Pendente', color: '#ef4444', fields: [
      { id: 'supplier', label: 'Fornecedor', type: 'text', required: true },
      { id: 'value', label: 'Valor (R$)', type: 'number', required: true },
      { id: 'due_date', label: 'Vencimento', type: 'date', required: true },
      { id: 'category', label: 'Categoria', type: 'select', options: [
        { value: 'servicos', label: 'Serviços' },
        { value: 'software', label: 'Software/Assinaturas' },
        { value: 'marketing', label: 'Marketing/Ads' },
        { value: 'pessoal', label: 'Pessoal' },
        { value: 'infraestrutura', label: 'Infraestrutura' },
        { value: 'impostos', label: 'Impostos' },
        { value: 'outros', label: 'Outros' },
      ]},
      { id: 'cost_center', label: 'Centro de Custo', type: 'select', options: [
        { value: 'operacional', label: 'Operacional' },
        { value: 'administrativo', label: 'Administrativo' },
        { value: 'comercial', label: 'Comercial' },
        { value: 'marketing', label: 'Marketing' },
      ]},
      { id: 'description', label: 'Descrição', type: 'textarea' },
    ]},
    { id: 'agendado', title: 'Agendado', color: '#f97316', fields: [
      { id: 'payment_date', label: 'Data do Pagamento', type: 'date', required: true },
      { id: 'payment_method', label: 'Forma de Pagamento', type: 'select', options: [
        { value: 'pix', label: 'PIX' },
        { value: 'boleto', label: 'Boleto' },
        { value: 'transferencia', label: 'Transferência' },
        { value: 'cartao', label: 'Cartão' },
        { value: 'debito', label: 'Débito Automático' },
      ]},
      { id: 'bank_account', label: 'Conta Bancária', type: 'select' },
    ]},
    { id: 'pago', title: 'Pago', color: '#10b981', fields: [
      { id: 'paid_at', label: 'Data do Pagamento', type: 'date', required: true },
      { id: 'paid_value', label: 'Valor Pago (R$)', type: 'number', required: true },
      { id: 'receipt', label: 'Comprovante', type: 'url' },
    ]},
    { id: 'arquivado', title: 'Arquivado', color: '#6b7280', fields: [] },
  ],
  contas_receber: [
    { id: 'a_faturar', title: 'A Faturar', color: '#8b5cf6', fields: [
      { id: 'client_id', label: 'Cliente', type: 'select', required: true },
      { id: 'value', label: 'Valor (R$)', type: 'number', required: true },
      { id: 'service', label: 'Serviço', type: 'text', required: true },
      { id: 'reference_month', label: 'Mês de Referência', type: 'text', placeholder: 'Ex: Janeiro/2025' },
      { id: 'description', label: 'Descrição', type: 'textarea' },
    ]},
    { id: 'faturado', title: 'Faturado', color: '#06b6d4', fields: [
      { id: 'invoice_number', label: 'Número da NF', type: 'text', required: true },
      { id: 'invoice_date', label: 'Data da Emissão', type: 'date', required: true },
      { id: 'due_date', label: 'Vencimento', type: 'date', required: true },
      { id: 'invoice_link', label: 'Link da NF', type: 'url' },
      { id: 'billing_status', label: 'Status da Cobrança', type: 'select', options: [
        { value: 'sent', label: 'Enviado' },
        { value: 'viewed', label: 'Visualizado' },
        { value: 'reminded', label: 'Lembrete Enviado' },
      ]},
    ]},
    { id: 'recebido', title: 'Recebido', color: '#10b981', fields: [
      { id: 'received_at', label: 'Data do Recebimento', type: 'date', required: true },
      { id: 'received_value', label: 'Valor Recebido (R$)', type: 'number', required: true },
      { id: 'payment_method', label: 'Forma de Recebimento', type: 'select', options: [
        { value: 'pix', label: 'PIX' },
        { value: 'boleto', label: 'Boleto' },
        { value: 'transferencia', label: 'Transferência' },
        { value: 'cartao', label: 'Cartão' },
      ]},
    ]},
    { id: 'arquivado', title: 'Arquivado', color: '#6b7280', fields: [] },
  ],
};

// ==================== HELPERS ====================

export function getPhaseFields(area: string, phaseId: string): PhaseField[] {
  const phases = KANBAN_PHASES[area] || KANBAN_PHASES.default;
  const phase = phases.find(p => p.id === phaseId);
  
  if (!phase) return [];

  // Combinar campos da fase com campos específicos da área
  const areaFields = AREA_SPECIFIC_FIELDS[area] || [];
  
  // Para a fase "demandas" ou "em_progresso", incluir campos específicos da área
  if (phaseId === 'demandas' || phaseId === 'em_progresso') {
    return [...phase.fields, ...areaFields];
  }

  return phase.fields;
}

export function getPhaseConfig(area: string): PhaseConfig[] {
  return KANBAN_PHASES[area] || KANBAN_PHASES.default;
}

export function getAreaName(areaId: string): string {
  const names: Record<string, string> = {
    'web_designer': 'Web Designer',
    'social_media': 'Social Media',
    'trafego': 'Tráfego',
    'video_maker': 'Video Maker',
    'designer': 'Designer',
    'head_marketing': 'Head Marketing',
    'comercial': 'Comercial',
    'rh': 'RH',
    'financeiro': 'Financeiro',
    'contas_pagar': 'Contas a Pagar',
    'contas_receber': 'Contas a Receber',
  };
  return names[areaId] || areaId;
}

// Lista de todas as áreas disponíveis para o Super Admin
export const ALL_AREAS = [
  { id: 'Web Designer', label: 'Web Designer', icon: '🌐' },
  { id: 'Social Media', label: 'Social Media', icon: '📱' },
  { id: 'Tráfego', label: 'Tráfego Pago', icon: '📊' },
  { id: 'Video Maker', label: 'Video Maker', icon: '🎬' },
  { id: 'Designer', label: 'Designer', icon: '🎨' },
  { id: 'Head Marketing', label: 'Head Marketing', icon: '📈' },
  { id: 'Comercial', label: 'Comercial', icon: '💼' },
  { id: 'RH', label: 'Recursos Humanos', icon: '👥' },
  { id: 'contas_pagar', label: 'Contas a Pagar', icon: '💸' },
  { id: 'contas_receber', label: 'Contas a Receber', icon: '💰' },
];
