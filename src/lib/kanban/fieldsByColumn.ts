// Campos específicos por coluna e área

export interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'url' | 'file' | 'date'
  placeholder?: string
  options?: string[]
  required?: boolean
}

export const fieldsByAreaAndColumn: Record<string, Record<string, FormField[]>> = {
  // DESIGNER
  Designer: {
    briefing: [
      { name: 'tipo_design', label: 'Tipo de Design', type: 'select', options: ['Banner', 'Post', 'Logo', 'Arte', 'Identidade Visual', 'Material Gráfico'], required: true },
      { name: 'dimensoes', label: 'Dimensões', type: 'text', placeholder: 'Ex: 1920x1080px' },
      { name: 'paleta_cores', label: 'Paleta de Cores', type: 'text', placeholder: 'Ex: #FF5733, #C70039' },
      { name: 'referencias', label: 'Referências', type: 'url', placeholder: 'Links de referência' }
    ],
    em_criacao: [
      { name: 'arquivos_trabalho', label: 'Arquivos de Trabalho', type: 'url', placeholder: 'Link do Figma/Adobe/etc' },
      { name: 'versao', label: 'Versão', type: 'number', placeholder: 'Ex: 1, 2, 3' }
    ],
    revisao: [
      { name: 'feedback_interno', label: 'Feedback Interno', type: 'textarea', placeholder: 'Feedback da equipe' },
      { name: 'alteracoes', label: 'Alterações Necessárias', type: 'textarea', placeholder: 'Liste as alterações' }
    ],
    aprovacao: [
      { name: 'feedback_cliente', label: 'Feedback do Cliente', type: 'textarea', placeholder: 'Retorno do cliente' },
      { name: 'rodada_aprovacao', label: 'Rodada de Aprovação', type: 'number', placeholder: 'Ex: 1, 2, 3' }
    ],
    enviado: [
      { name: 'link_final', label: 'Link Final', type: 'url', placeholder: 'Link do arquivo final' },
      { name: 'formatos_entregues', label: 'Formatos Entregues', type: 'text', placeholder: 'Ex: PNG, JPG, PDF, AI' }
    ]
  },

  // SOCIAL MEDIA
  'Social Media': {
    planejamento: [
      { name: 'rede_social', label: 'Rede Social', type: 'select', options: ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'Twitter', 'Pinterest'], required: true },
      { name: 'tipo_conteudo', label: 'Tipo de Conteúdo', type: 'select', options: ['Post', 'Story', 'Reels', 'Carrossel', 'Video'], required: true },
      { name: 'tema', label: 'Tema', type: 'text', placeholder: 'Tema do post' }
    ],
    criacao: [
      { name: 'copy', label: 'Copy', type: 'textarea', placeholder: 'Texto do post', required: true },
      { name: 'hashtags', label: 'Hashtags', type: 'text', placeholder: '#exemplo #hashtag' },
      { name: 'call_to_action', label: 'Call to Action', type: 'text', placeholder: 'Ex: Clique no link da bio' }
    ],
    aprovacao_interna: [
      { name: 'aprovador', label: 'Aprovador', type: 'text', placeholder: 'Quem aprovou' },
      { name: 'ajustes_sugeridos', label: 'Ajustes Sugeridos', type: 'textarea', placeholder: 'Sugestões de melhorias' }
    ],
    agendado: [
      { name: 'data_publicacao', label: 'Data de Publicação', type: 'date', required: true },
      { name: 'horario', label: 'Horário', type: 'text', placeholder: 'Ex: 18:00' }
    ],
    publicado: [
      { name: 'link_post', label: 'Link do Post', type: 'url', placeholder: 'URL do post publicado' },
      { name: 'metricas', label: 'Métricas Iniciais', type: 'text', placeholder: 'Curtidas, comentários, etc' }
    ]
  },

  // VIDEOMAKER
  Videomaker: {
    briefing: [
      { name: 'tipo_video', label: 'Tipo de Vídeo', type: 'select', options: ['Institucional', 'Depoimento', 'Motion Graphics', 'Animação', 'Tutorial', 'Reel'], required: true },
      { name: 'duracao_estimada', label: 'Duração Estimada', type: 'text', placeholder: 'Ex: 30s, 1min' },
      { name: 'objetivo', label: 'Objetivo', type: 'textarea', placeholder: 'Objetivo do vídeo' }
    ],
    pre_producao: [
      { name: 'roteiro', label: 'Roteiro', type: 'textarea', placeholder: 'Roteiro do vídeo' },
      { name: 'storyboard', label: 'Storyboard', type: 'url', placeholder: 'Link do storyboard' },
      { name: 'locacao', label: 'Locação', type: 'text', placeholder: 'Local da gravação' }
    ],
    gravacao: [
      { name: 'data_gravacao', label: 'Data da Gravação', type: 'date' },
      { name: 'equipamento', label: 'Equipamento', type: 'text', placeholder: 'Câmera, lentes, etc' },
      { name: 'takes', label: 'Takes', type: 'number', placeholder: 'Número de takes' }
    ],
    edicao: [
      { name: 'software', label: 'Software', type: 'select', options: ['Premiere', 'Final Cut', 'DaVinci', 'After Effects'] },
      { name: 'trilha_sonora', label: 'Trilha Sonora', type: 'text', placeholder: 'Nome/link da música' },
      { name: 'efeitos', label: 'Efeitos', type: 'textarea', placeholder: 'Efeitos aplicados' }
    ],
    aprovacao: [
      { name: 'versao_final', label: 'Versão Final', type: 'url', placeholder: 'Link da versão final' },
      { name: 'feedback', label: 'Feedback', type: 'textarea', placeholder: 'Retorno do cliente' }
    ],
    entregue: [
      { name: 'formato_entrega', label: 'Formato de Entrega', type: 'text', placeholder: 'Ex: MP4 1080p' },
      { name: 'plataformas', label: 'Plataformas', type: 'text', placeholder: 'Onde será publicado' }
    ]
  },

  // WEB DESIGNER
  'Web Designer': {
    briefing: [
      { name: 'tipo_projeto', label: 'Tipo de Projeto', type: 'select', options: ['Landing Page', 'Site Institucional', 'E-commerce', 'Blog', 'Portal', 'Sistema Web'], required: true },
      { name: 'tecnologias', label: 'Tecnologias', type: 'text', placeholder: 'Ex: React, WordPress, etc' },
      { name: 'responsivo', label: 'Responsivo', type: 'select', options: ['Sim', 'Não'], required: true }
    ],
    desenvolvimento: [
      { name: 'framework', label: 'Framework', type: 'select', options: ['Next.js', 'React', 'Vue', 'WordPress', 'Custom'] },
      { name: 'repositorio', label: 'Repositório', type: 'url', placeholder: 'Link do GitHub/GitLab' },
      { name: 'ambiente_dev', label: 'Ambiente de Dev', type: 'url', placeholder: 'URL de desenvolvimento' }
    ],
    revisao: [
      { name: 'bugs', label: 'Bugs Encontrados', type: 'textarea', placeholder: 'Liste os bugs' },
      { name: 'melhorias', label: 'Melhorias', type: 'textarea', placeholder: 'Sugestões de melhorias' }
    ],
    homologacao: [
      { name: 'ambiente_homolog', label: 'Ambiente de Homologação', type: 'url', placeholder: 'URL de homologação' },
      { name: 'testes', label: 'Testes Realizados', type: 'textarea', placeholder: 'Descreva os testes' }
    ],
    deploy: [
      { name: 'url_producao', label: 'URL de Produção', type: 'url', placeholder: 'URL final do site' },
      { name: 'data_deploy', label: 'Data do Deploy', type: 'date' }
    ],
    suporte: [
      { name: 'tipo_ticket', label: 'Tipo de Ticket', type: 'select', options: ['Bug', 'Melhoria', 'Atualização', 'Dúvida'] },
      { name: 'descricao_ticket', label: 'Descrição', type: 'textarea', placeholder: 'Descreva o problema/solicitação' }
    ]
  },

  // COMERCIAL
  Comercial: {
    lead: [
      { name: 'origem', label: 'Origem do Lead', type: 'select', options: ['Website', 'Indicação', 'LinkedIn', 'Telefone', 'Email', 'Evento'] },
      { name: 'segmento', label: 'Segmento', type: 'text', placeholder: 'Segmento da empresa' },
      { name: 'tamanho_empresa', label: 'Tamanho', type: 'select', options: ['Pequena', 'Média', 'Grande'] }
    ],
    qualificado: [
      { name: 'budget', label: 'Budget Estimado', type: 'number', placeholder: 'Valor em R$' },
      { name: 'timeline', label: 'Timeline', type: 'text', placeholder: 'Prazo desejado' },
      { name: 'decisor', label: 'Decisor', type: 'text', placeholder: 'Nome do decisor' }
    ],
    proposta: [
      { name: 'valor_proposta', label: 'Valor da Proposta', type: 'number', placeholder: 'R$', required: true },
      { name: 'link_proposta', label: 'Link da Proposta', type: 'url', placeholder: 'Link do documento' },
      { name: 'validade', label: 'Validade', type: 'date' }
    ],
    negociacao: [
      { name: 'objecoes', label: 'Objeções', type: 'textarea', placeholder: 'Objeções do cliente' },
      { name: 'contra_proposta', label: 'Contra-proposta', type: 'number', placeholder: 'Valor proposto pelo cliente' },
      { name: 'proximo_passo', label: 'Próximo Passo', type: 'text', placeholder: 'O que fazer a seguir' }
    ],
    ganho: [
      { name: 'valor_fechado', label: 'Valor Fechado', type: 'number', placeholder: 'R$', required: true },
      { name: 'data_fechamento', label: 'Data do Fechamento', type: 'date', required: true },
      { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: ['À vista', 'Parcelado', 'Recorrente'] }
    ]
  },

  // TRÁFEGO PAGO
  'Tráfego Pago': {
    planejamento: [
      { name: 'plataforma', label: 'Plataforma', type: 'select', options: ['Google Ads', 'Facebook Ads', 'Instagram Ads', 'LinkedIn Ads', 'TikTok Ads'], required: true },
      { name: 'objetivo_campanha', label: 'Objetivo', type: 'select', options: ['Tráfego', 'Conversões', 'Reconhecimento', 'Engajamento'], required: true },
      { name: 'budget_total', label: 'Budget Total', type: 'number', placeholder: 'R$', required: true }
    ],
    criacao: [
      { name: 'copy_anuncio', label: 'Copy do Anúncio', type: 'textarea', placeholder: 'Texto do anúncio' },
      { name: 'criativos', label: 'Criativos', type: 'url', placeholder: 'Links das imagens/vídeos' },
      { name: 'segmentacao', label: 'Segmentação', type: 'textarea', placeholder: 'Público-alvo' }
    ],
    aprovacao: [
      { name: 'aprovado_por', label: 'Aprovado Por', type: 'text', placeholder: 'Nome do aprovador' },
      { name: 'ajustes', label: 'Ajustes', type: 'textarea', placeholder: 'Ajustes solicitados' }
    ],
    ativo: [
      { name: 'data_inicio', label: 'Data de Início', type: 'date', required: true },
      { name: 'link_campanha', label: 'Link da Campanha', type: 'url', placeholder: 'Link no gerenciador' }
    ],
    otimizacao: [
      { name: 'ctr', label: 'CTR', type: 'number', placeholder: '%' },
      { name: 'cpc', label: 'CPC', type: 'number', placeholder: 'R$' },
      { name: 'acoes_otimizacao', label: 'Ações de Otimização', type: 'textarea', placeholder: 'O que foi otimizado' }
    ],
    pausado: [
      { name: 'motivo_pausa', label: 'Motivo da Pausa', type: 'textarea', placeholder: 'Por que foi pausado' },
      { name: 'resultados_finais', label: 'Resultados Finais', type: 'textarea', placeholder: 'Métricas finais' }
    ]
  },

  // RH
  RH: {
    solicitacao: [
      { name: 'tipo_solicitacao', label: 'Tipo de Solicitação', type: 'select', options: ['Férias', 'Home Office', 'Atestado', 'Reembolso', 'Treinamento'], required: true },
      { name: 'solicitante', label: 'Solicitante', type: 'text', placeholder: 'Nome do colaborador' },
      { name: 'periodo', label: 'Período', type: 'text', placeholder: 'Ex: 01/12 a 10/12' }
    ],
    analise: [
      { name: 'analista', label: 'Analista', type: 'text', placeholder: 'Nome do analista' },
      { name: 'parecer_inicial', label: 'Parecer Inicial', type: 'textarea', placeholder: 'Análise da solicitação' }
    ],
    aprovacao_gestor: [
      { name: 'gestor', label: 'Gestor', type: 'text', placeholder: 'Nome do gestor' },
      { name: 'aprovado', label: 'Status', type: 'select', options: ['Aprovado', 'Rejeitado', 'Pendente'] },
      { name: 'observacoes_gestor', label: 'Observações', type: 'textarea', placeholder: 'Observações do gestor' }
    ],
    aprovacao_rh: [
      { name: 'responsavel_rh', label: 'Responsável RH', type: 'text', placeholder: 'Nome do responsável' },
      { name: 'status_final', label: 'Status Final', type: 'select', options: ['Aprovado', 'Rejeitado'] },
      { name: 'justificativa', label: 'Justificativa', type: 'textarea', placeholder: 'Justificativa da decisão' }
    ],
    concluido: [
      { name: 'data_conclusao', label: 'Data de Conclusão', type: 'date' },
      { name: 'documento_gerado', label: 'Documento Gerado', type: 'url', placeholder: 'Link do documento' }
    ]
  },

  // FINANCEIRO
  Financeiro: {
    pendente: [
      { name: 'tipo_transacao', label: 'Tipo de Transação', type: 'select', options: ['Pagamento', 'Recebimento', 'Reembolso', 'Transferência'], required: true },
      { name: 'valor', label: 'Valor', type: 'number', placeholder: 'R$', required: true },
      { name: 'categoria', label: 'Categoria', type: 'text', placeholder: 'Ex: Fornecedores, Salários' }
    ],
    em_analise: [
      { name: 'analista_financeiro', label: 'Analista', type: 'text', placeholder: 'Nome do analista' },
      { name: 'documentacao', label: 'Documentação', type: 'url', placeholder: 'Links dos documentos' }
    ],
    aprovado: [
      { name: 'aprovador', label: 'Aprovador', type: 'text', placeholder: 'Nome do aprovador' },
      { name: 'data_aprovacao', label: 'Data de Aprovação', type: 'date' }
    ],
    processado: [
      { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: ['Transferência', 'Boleto', 'Cartão', 'PIX'] },
      { name: 'comprovante', label: 'Comprovante', type: 'url', placeholder: 'Link do comprovante' }
    ],
    pago: [
      { name: 'data_pagamento', label: 'Data do Pagamento', type: 'date', required: true },
      { name: 'numero_transacao', label: 'Número da Transação', type: 'text', placeholder: 'ID da transação' }
    ]
  },

  // HEAD DE MARKETING
  'Head de Marketing': {
    backlog: [
      { name: 'tipo_iniciativa', label: 'Tipo de Iniciativa', type: 'select', options: ['Campanha', 'Estratégia', 'Análise', 'Projeto'], required: true },
      { name: 'prioridade', label: 'Prioridade', type: 'select', options: ['Alta', 'Média', 'Baixa'], required: true }
    ],
    planejamento: [
      { name: 'estrategia', label: 'Estratégia', type: 'textarea', placeholder: 'Descreva a estratégia' },
      { name: 'budget_estimado', label: 'Budget Estimado', type: 'number', placeholder: 'R$' },
      { name: 'kpis', label: 'KPIs', type: 'text', placeholder: 'Ex: CTR, Conversões, ROI' }
    ],
    em_execucao: [
      { name: 'equipe_responsavel', label: 'Equipe Responsável', type: 'text', placeholder: 'Área ou time' },
      { name: 'progresso', label: 'Progresso', type: 'number', placeholder: '%' }
    ],
    revisao: [
      { name: 'metricas_atuais', label: 'Métricas Atuais', type: 'textarea', placeholder: 'Resultados obtidos' },
      { name: 'analise', label: 'Análise', type: 'textarea', placeholder: 'Análise dos resultados' }
    ],
    concluido: [
      { name: 'resultados_finais', label: 'Resultados Finais', type: 'textarea', placeholder: 'Métricas finais' },
      { name: 'relatorio', label: 'Relatório', type: 'url', placeholder: 'Link do relatório final' }
    ]
  }
}

// Função para obter campos específicos
export function getFieldsByAreaAndColumn(area: string, column: string): FormField[] {
  const normalizedArea = area in fieldsByAreaAndColumn ? area : 
    Object.keys(fieldsByAreaAndColumn).find(key => 
      key.toLowerCase() === area.toLowerCase()
    ) || ''

  if (normalizedArea && fieldsByAreaAndColumn[normalizedArea]) {
    return fieldsByAreaAndColumn[normalizedArea][column] || []
  }

  return []
}


