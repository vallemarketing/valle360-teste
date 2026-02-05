# 🎮 GAMIFICAÇÃO + ML + IA - MAPEAMENTO COMPLETO
## Todas as Funcionalidades Criadas no Banco

---

## 📊 GAMIFICAÇÃO (Migration 11)

### 1. **employee_gamification_scores**
```sql
- total_points (pontos totais)
- level (nível atual: 1, 2, 3...)
- productivity_score (0-100)
- quality_score (0-100)
- collaboration_score (0-100)
- badges (array JSON de badges conquistados)
- achievements (array JSON de conquistas)
- current_streak (dias consecutivos ativos)
- longest_streak (maior sequência de dias)
```

### 2. **gamification_achievements**
```sql
- achievement_name (nome da conquista)
- achievement_description (descrição)
- achievement_type (employee, client, both)
- icon (ícone da conquista)
- points_awarded (pontos concedidos)
- criteria (critérios JSON para desbloquear)
- is_active (se está ativo)
```

**Exemplos de Conquistas:**
- 🏆 "Primeiro Projeto" (5 pontos)
- 🔥 "Sequência de 7 Dias" (20 pontos)
- ⭐ "10 Tarefas em um Dia" (15 pontos)
- 💯 "100% de Qualidade" (30 pontos)
- 👥 "Colaborador do Mês" (50 pontos)
- 🚀 "Inovador" (40 pontos)

---

## 🤖 IA & MACHINE LEARNING - INTELIGÊNCIA DE COLABORADORES

### 3. **employee_churn_predictions** (Migration 22)
**Predição de Saída de Colaboradores**
```sql
- churn_probability (0-100%)
- risk_level (low, medium, high, critical)
- days_until_churn (dias até saída prevista)
- predicted_churn_date (data prevista)
- contributing_factors (fatores que contribuem JSON)
- warning_signals (sinais de alerta)
- recommended_actions (ações recomendadas)
- intervention_status (pending, in_progress, completed)
```

**Fatores Analisados:**
- Performance baixa
- Engajamento baixo
- Salário abaixo do mercado
- Falta de crescimento
- Atrasos frequentes
- Recusa de projetos

### 4. **employee_behavioral_analysis** (Migration 22)
**Análise Comportamental Profunda**
```sql
- engagement_score (0-100)
- engagement_trend (improving, stable, declining)
- productivity_score (0-100)
- tasks_completed (tarefas finalizadas)
- tasks_overdue (tarefas atrasadas)
- quality_score (0-100)
- rework_rate (taxa de retrabalho)
- collaboration_score (0-100)
- wellbeing_score (0-100)
- stress_level (low, medium, high, critical)
- red_flags (alertas vermelhos JSON)
- strengths (pontos fortes JSON)
- sentiment_score (-1 a +1)
- ai_recommendations (recomendações da IA JSON)
- overall_health_score (0-100, calculado)
```

### 5. **employee_intervention_recommendations** (Migration 22)
**Recomendações de Ações de RH pela IA**
```sql
- recommendation_type (terminate, pip, promote, praise, coach, etc)
- priority (1-10)
- urgency (immediate, this_week, this_month, low)
- title (título da recomendação)
- description (descrição completa)
- reasoning (justificativa da IA)
- supporting_data (dados de suporte JSON)
- estimated_impact (high, medium, low)
- suggested_approach (abordagem sugerida)
- conversation_script (script de conversa)
- status (pending, approved, in_progress, completed)
```

**Tipos de Intervenção:**
- `terminate` - Demitir
- `pip` - Plano de Melhoria de Performance
- `promote` - Promover
- `praise` - Elogiar publicamente
- `coach` - Oferecer coaching
- `mentor` - Atribuir mentor
- `train` - Oferecer treinamento
- `salary_review` - Revisar salário
- `one_on_one` - Marcar 1-on-1
- `workload_adjustment` - Ajustar carga de trabalho
- `role_change` - Mudar de função
- `team_change` - Mudar de time

### 6. **employee_one_on_one_meetings** (Migration 22)
**Reuniões 1-on-1 com Sugestões de IA**
```sql
- ai_suggested_topics (tópicos sugeridos pela IA)
- ai_suggested_questions (perguntas sugeridas)
- agenda (pauta da reunião)
- notes (notas da reunião)
- mood_before (humor antes)
- mood_after (humor depois)
- action_items (itens de ação)
- requires_followup (precisa de follow-up?)
```

### 7. **employee_motivation_messages** (Migration 22)
**Mensagens Automáticas de Motivação**
```sql
- message_type (motivation, congratulation, reminder, encouragement, etc)
- trigger_event (o que causou o envio)
- message_content (conteúdo da mensagem)
- channel (email, slack, whatsapp, in_app, sms)
- is_personalized (personalizada?)
- status (pending, sent, delivered, read, failed)
- employee_response (resposta do colaborador)
- was_effective (foi efetiva?)
```

**Tipos de Mensagem:**
- `motivation` - Motivacional
- `congratulation` - Parabéns
- `reminder` - Lembrete
- `encouragement` - Encorajamento
- `recognition` - Reconhecimento
- `support` - Apoio
- `check_in` - Check-in de bem-estar
- `achievement` - Conquista
- `milestone` - Marco importante

### 8. **employee_task_reminders** (Migration 22)
**Lembretes Inteligentes de Tarefas**
```sql
- task_id (ID da tarefa)
- task_type (kanban_card, employee_goal, action_item)
- task_title (título da tarefa)
- reminder_type (overdue, due_soon, gentle_nudge, urgent, final_warning)
- priority (low, medium, high, urgent)
- message (mensagem do lembrete)
- channel (email, slack, whatsapp, in_app, sms)
- status (pending, sent, acknowledged, task_completed, snoozed)
- snoozed_until (adiado até quando)
- is_recurring (lembrete recorrente?)
```

---

## 🎉 ENGAJAMENTO & MOTIVAÇÃO (Migration 23)

### 9. **employee_wellbeing_checkins**
**Check-ins Diários de Bem-Estar**
```sql
- checkin_date (data do check-in)
- mood (very_happy, happy, neutral, sad, very_sad, stressed, anxious, excited)
- mood_score (1-10)
- energy_level (very_high, high, medium, low, very_low)
- energy_score (1-10)
- motivation_level (very_motivated, motivated, neutral, demotivated, burned_out)
- motivation_score (1-10)
- workload_perception (too_much, just_right, too_little)
- job_satisfaction_score (1-10)
- feelings (sentimentos do dia)
- challenges (desafios enfrentados)
- wins (vitórias do dia)
- needs_help_with (precisa ajuda com)
- ai_response (resposta automática da IA)
- requires_manager_attention (precisa atenção do gestor?)
```

### 10. **employee_recognition_events**
**Eventos de Reconhecimento**
```sql
- recognition_type (peer, manager, client_praise, achievement, milestone, etc)
- title (título do reconhecimento)
- description (descrição)
- is_public (visível para todos?)
- reactions (likes, loves, claps, fires)
- comments_count (quantidade de comentários)
- points_awarded (pontos concedidos)
- attachments (fotos, vídeos)
```

**Tipos de Reconhecimento:**
- `peer_recognition` - Colega reconheceu
- `manager_recognition` - Gestor reconheceu
- `client_praise` - Elogio de cliente
- `achievement` - Conquista
- `milestone` - Marco importante
- `innovation` - Inovação
- `helping_others` - Ajudou outros
- `leadership` - Liderança
- `quality_work` - Trabalho de qualidade
- `going_extra_mile` - Foi além

### 11. **employee_learning_development**
**Aprendizado e Desenvolvimento**
```sql
- item_type (course, workshop, book, certification, conference, mentorship)
- title (título do curso/livro)
- provider (Udemy, Coursera, etc)
- skill_name (habilidade relacionada)
- skill_level_before (beginner, intermediate, advanced, expert)
- skill_level_after (novo nível após aprendizado)
- status (planned, in_progress, completed, abandoned)
- progress_percentage (0-100%)
- has_certificate (tem certificado?)
- employee_rating (1-5 estrelas)
- recommended_by_ai (recomendado pela IA?)
```

### 12. **employee_career_path**
**Plano de Carreira**
```sql
- current_level (nível atual)
- target_level (nível alvo)
- target_position (cargo alvo)
- estimated_timeline_months (tempo estimado em meses)
- requirements (requisitos JSON)
- required_skills (skills necessárias JSON)
- milestones (marcos do plano JSON)
- overall_progress (progresso geral 0-100%)
- ai_suggested_next_steps (próximos passos sugeridos pela IA)
- mentor_id (mentor atribuído)
```

### 13. **employee_feedback_360**
**Feedback 360 Graus**
```sql
- feedback_cycle (ciclo: "2024-Q1", "Annual 2024")
- reviewer_relationship (manager, peer, direct_report, client, self)
- technical_skills_rating (1-5)
- communication_rating (1-5)
- teamwork_rating (1-5)
- leadership_rating (1-5)
- problem_solving_rating (1-5)
- time_management_rating (1-5)
- adaptability_rating (1-5)
- strengths (pontos fortes)
- areas_for_improvement (áreas para melhorar)
- development_suggestions (sugestões de desenvolvimento)
- is_anonymous (anônimo?)
```

### 14. **employee_celebration_events**
**Eventos de Celebração**
```sql
- event_type (birthday, work_anniversary, promotion, achievement, milestone)
- event_date (data do evento)
- title (título)
- auto_generated (gerado automaticamente pela IA?)
- team_notified (equipe foi notificada?)
- celebration_message (mensagem de celebração)
- celebration_gif_url (GIF de celebração)
- reactions (likes, loves, congrats, fires)
- comments (comentários JSON)
```

---

## 🔢 FUNÇÕES SQL CRIADAS

### Função 1: `analyze_employee_behavior(employee_id, date)`
**Analisa comportamento e performance**
- Conta tarefas completadas e atrasadas
- Calcula scores de produtividade e engajamento
- Retorna ID da análise

### Função 2: `predict_employee_churn(employee_id)`
**Prediz probabilidade de saída**
- Analisa últimos 30 dias de métricas
- Calcula probabilidade de churn (0-100%)
- Determina nível de risco
- Identifica fatores contribuintes
- Retorna probabilidade

### Função 3: `send_automatic_motivation_message(employee_id, type, trigger, message)`
**Envia mensagem motivacional automática**
- Personaliza mensagem com nome do colaborador
- Define canal de envio
- Agenda envio
- Retorna ID da mensagem

### Função 4: `calculate_employee_wellbeing_score(employee_id, days)`
**Calcula score geral de bem-estar**
- Média de mood, energia, motivação, satisfação
- Últimos X dias (padrão: 30)
- Retorna score 0-100

### Função 5: `detect_employees_needing_attention()`
**Detecta colaboradores precisando de atenção**
- Humor baixo por 3+ dias
- Muitas tarefas atrasadas (5+)
- Alto risco de churn
- Retorna lista com razão, urgência e ação sugerida

---

## 🎯 IMPLEMENTAÇÃO NA ÁREA DO COLABORADOR

### DASHBOARD DO COLABORADOR
✅ Card: Pontos e Nível (gamificação)
✅ Card: Streak Atual
✅ Card: Badges Conquistados
✅ Card: Posição no Ranking
✅ Card: Tarefas do Dia
✅ Card: Score de Bem-Estar
✅ Card: Próximo 1-on-1
✅ Alertas da IA Val (mensagens motivacionais)
✅ Gráfico: Evolução de Pontos
✅ Gráfico: Produtividade Semanal
✅ Feed: Reconhecimentos Recentes
✅ Feed: Celebrações da Equipe

### KANBAN (ESPECIALISTA)
✅ Colunas customizáveis por área
✅ Drag & Drop
✅ Filtros avançados
✅ Prioridades visuais
✅ Estimativa de tempo
✅ Tags por tipo de trabalho
✅ Integração com gamificação (pontos ao concluir)
✅ Lembretes automáticos (IA)
✅ Sugestões de otimização (IA)

### MENU DE PERFIL
✅ Editar Perfil
✅ 🎮 Gamificação (nova aba)
✅ 🎁 Programa de Fidelidade (nova aba)
✅ 🎯 Minhas Metas
✅ 📊 Meu Desempenho
✅ 🔔 Notificações (nova aba)
✅ ⚙️ Configurações
✅ 💬 Suporte
✅ 🚪 Sair

### GAMIFICAÇÃO (Nova Página)
✅ Nível atual e progresso
✅ Pontos totais
✅ Badges conquistados
✅ Conquistas desbloqueadas
✅ Ranking geral da equipe
✅ Streak atual e recorde
✅ Histórico de pontos
✅ Próximas conquistas (com progresso)
✅ Scores detalhados (produtividade, qualidade, colaboração)

### PROGRAMA DE FIDELIDADE (Nova Página)
✅ Cupom de indicação exclusivo
✅ Contador de indicações
✅ Previsão de bônus (10% do valor do contrato)
✅ Status de indicações (pendente, fechada, cancelada)
✅ Histórico de comissões recebidas
✅ Regras do programa
✅ Compartilhar cupom (WhatsApp, Email, Link)

### NOTIFICAÇÕES (Nova Página)
✅ Centro de notificações unificado
✅ Mensagens motivacionais da IA
✅ Lembretes de tarefas
✅ Reconhecimentos recebidos
✅ Celebrações da equipe
✅ Alertas de prazo
✅ Filtros (não lidas, tipo, data)
✅ Marcar como lida/arquivar

### VAL (IA) - ÁREA DO COLABORADOR
**Sugestões Rápidas Personalizadas:**
- "Como está minha performance esta semana?"
- "Quais tarefas tenho pendentes?"
- "Mostre meu ranking de gamificação"
- "Como melhorar minha produtividade?"
- "Quando é meu próximo 1-on-1?"
- "Quais treinamentos você recomenda?"
- "Como estou comparado ao time?"
- "Me dê feedback sobre meu trabalho recente"

**Funcionalidades:**
✅ Análise de performance em tempo real
✅ Sugestões de melhoria personalizadas
✅ Recomendações de cursos/treinamentos
✅ Feedback sobre tarefas concluídas
✅ Comparação com equipe (anônima)
✅ Dicas de produtividade
✅ Alertas de bem-estar
✅ Celebração de conquistas

### MINHAS METAS (Nova Página)
✅ Metas individuais
✅ Progresso visual (barras, gráficos)
✅ Metas de curto, médio e longo prazo
✅ Sugestões de metas pela IA
✅ Milestones do plano de carreira
✅ Skills a desenvolver
✅ Próxima promoção (progresso)

### MEU DESEMPENHO (Nova Página)
✅ Scores detalhados
✅ Gráficos de tendência (últimos 3 meses)
✅ Comparação com média da equipe
✅ Feedback 360 recebido
✅ Reconhecimentos
✅ Áreas de destaque
✅ Áreas para melhorar
✅ Recomendações de desenvolvimento

### SOLICITAÇÕES
✅ Home Office
✅ Férias
✅ Atestado
✅ Reembolso
✅ Curso/Treinamento
✅ Equipamento
✅ Adiantamento
✅ Ajuste de Carga de Trabalho

---

## 🏗️ ESTRUTURA DO KANBAN ESPECIALISTA

### COLUNAS PADRÃO (Customizáveis)
1. **📋 Backlog** (Não priorizado)
2. **📌 A Fazer** (Priorizado)
3. **⏳ Em Andamento** (Limitado WIP: 3-5)
4. **🔍 Em Revisão** (Aguardando feedback)
5. **✅ Concluído** (Última semana)
6. **🗄️ Arquivado** (Antigos)

### CAMPOS DO CARD
```
- Título
- Descrição (markdown)
- Cliente relacionado
- Projeto relacionado
- Tipo (Design, Código, Copywriting, Estratégia, etc)
- Prioridade (🔴 Urgente, 🟡 Alta, 🟢 Normal, ⚪ Baixa)
- Prazo
- Estimativa de tempo (horas)
- Tempo gasto (tracking)
- Assignees (responsáveis)
- Tags (múltiplas)
- Checklist (subtarefas)
- Anexos
- Comentários
- Dependências (bloqueia/bloqueado por)
- Pontos de gamificação ao concluir
```

### FUNCIONALIDADES AVANÇADAS
✅ **WIP Limit** (Work In Progress) - Limite de cards por coluna
✅ **Swimlanes** - Organizar por cliente, projeto ou tipo
✅ **Quick Add** - Adicionar card rápido (Ctrl+K)
✅ **Bulk Actions** - Ações em massa
✅ **Templates** - Templates de cards comuns
✅ **Time Tracking** - Contador de tempo integrado
✅ **Automações**:
   - Mover card automaticamente quando checklist 100%
   - Notificar responsável quando prazo próximo
   - Atribuir pontos ao concluir
   - Enviar para revisão automaticamente
✅ **Filtros Avançados**:
   - Por cliente
   - Por projeto
   - Por responsável
   - Por prazo (hoje, semana, mês, atrasado)
   - Por tipo de trabalho
   - Por prioridade
✅ **Visualizações**:
   - Kanban (padrão)
   - Lista
   - Timeline (Gantt)
   - Calendário
✅ **Analytics do Kanban**:
   - Lead Time (tempo médio para concluir)
   - Cycle Time (tempo médio em andamento)
   - Throughput (quantos cards/semana)
   - Burndown Chart
   - Cumulative Flow Diagram

---

## 💰 SISTEMA DE FIDELIDADE - DETALHAMENTO

### CUPOM DE INDICAÇÃO
```
Formato: VALLE-[NOME_COLABORADOR]-[6_DIGITOS]
Exemplo: VALLE-GUILHERME-A3X9K2

Regras:
- Cupom único por colaborador
- Válido por tempo indeterminado
- Cliente usa no fechamento do contrato
- 10% do valor do contrato vai para o salário do próximo mês
- Pagamento automático após cliente assinar contrato
```

### TABELA: employee_referral_program
```sql
CREATE TABLE employee_referral_program (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  
  times_used INTEGER DEFAULT 0,
  total_earned NUMERIC(10, 2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### TABELA: employee_referrals
```sql
CREATE TABLE employee_referrals (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  client_id UUID REFERENCES clients(id),
  
  referral_code VARCHAR(50) NOT NULL,
  
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  
  contract_value NUMERIC(10, 2),
  commission_percentage NUMERIC(5, 2) DEFAULT 10.00,
  commission_amount NUMERIC(10, 2),
  
  status VARCHAR(20) CHECK (status IN ('pending', 'contract_signed', 'paid', 'cancelled')),
  
  referred_at TIMESTAMP,
  contract_signed_at TIMESTAMP,
  commission_paid_at TIMESTAMP,
  
  payment_month VARCHAR(7), -- "2024-12"
  
  notes TEXT
);
```

### DASHBOARD DE FIDELIDADE
```
┌─────────────────────────────────────────────────────────────┐
│  🎁 Programa de Fidelidade Valle 360                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SEU CUPOM EXCLUSIVO:                                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │          VALLE-GUILHERME-A3X9K2                        │ │
│  │                                                         │ │
│  │  [📋 Copiar] [📱 WhatsApp] [📧 Email] [🔗 Link]      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  SUAS INDICAÇÕES:                                          │
│                                                             │
│  [Card] Total Indicado: 3 clientes                        │
│  [Card] Total Ganho: R$ 2.450,00                          │
│  [Card] Próximo Pagamento: R$ 850,00 (Dez/2024)          │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  HISTÓRICO:                                                │
│                                                             │
│  ✅ Tech Startup - R$ 8.500 → Você ganhou: R$ 850         │
│     Status: Contrato assinado • Pago em Nov/2024          │
│                                                             │
│  ✅ Marketing Corp - R$ 12.000 → Você ganhou: R$ 1.200    │
│     Status: Contrato assinado • Pago em Out/2024          │
│                                                             │
│  ⏳ Agência Digital - R$ 6.000 → Você ganhará: R$ 600     │
│     Status: Em negociação • Previsão: Dez/2024            │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  COMO FUNCIONA:                                            │
│  1. Compartilhe seu cupom com empresas interessadas        │
│  2. Cliente menciona o cupom no fechamento                 │
│  3. Você recebe 10% do valor do contrato                   │
│  4. Pagamento automático no salário do próximo mês         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ RESUMO FINAL

**Total de Tabelas de Gamificação/IA/ML:** 14
**Total de Funções SQL:** 5
**Total de Páginas Novas para Colaborador:** 7

### Páginas Implementadas:
1. Dashboard (com gamificação integrada)
2. Kanban (sistema completo especialista)
3. Mensagens (já definido)
4. Val IA (personalizada por área)
5. 🎮 Gamificação (NOVA)
6. 🎁 Fidelidade (NOVA)
7. 🔔 Notificações (NOVA)
8. 🎯 Minhas Metas (NOVA)
9. 📊 Meu Desempenho (NOVA)
10. 📝 Solicitações (já definido)

---

**AGORA VOU IMPLEMENTAR TUDO! 🚀**











