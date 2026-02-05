# VALLE 360 - DOCUMENTAÇÃO COMPLETA DO SISTEMA
## PARTE 1B: ESTRUTURA DE TABELAS DO BANCO DE DADOS (Continuação)

---

## 6. MÓDULO DE KANBAN E GESTÃO DE PROJETOS

### 6.1 Tabela: `kanban_boards`
**Descrição**: Quadros Kanban para gestão de projetos

```sql
CREATE TABLE kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Departamento/área
  department VARCHAR(100),
  
  -- Controle de acesso
  is_public BOOLEAN DEFAULT false,
  allowed_roles JSONB DEFAULT '[]'::jsonb,
  
  -- Configurações
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_kanban_boards_department ON kanban_boards(department);
CREATE INDEX idx_kanban_boards_created_by ON kanban_boards(created_by);
```

### 6.2 Tabela: `kanban_columns`
**Descrição**: Colunas dos quadros Kanban

```sql
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações da coluna
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Ordem e estilo
  position INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(20) DEFAULT '#cccccc',
  
  -- Limite WIP (Work In Progress)
  wip_limit INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX idx_kanban_columns_position ON kanban_columns(board_id, position);
```

### 6.3 Tabela: `kanban_labels`
**Descrição**: Etiquetas/tags para cards do Kanban

```sql
CREATE TABLE kanban_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações da label
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_kanban_labels_board_id ON kanban_labels(board_id);
```

### 6.4 Tabela: `kanban_tasks` (Cards)
**Descrição**: Cards/tarefas do Kanban

```sql
CREATE TABLE kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Posição na coluna
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Atribuição (múltiplos usuários)
  assigned_to JSONB DEFAULT '[]'::jsonb,
  -- Formato: ["user_id_1", "user_id_2"]
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Cliente relacionado (opcional)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Prazo
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Labels/tags
  label_ids JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Prioridade
  priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  
  -- Checklist
  checklist JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ "id": "", "text": "", "completed": false }]
  
  -- Anexos
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ "id": "", "name": "", "url": "", "size": 0, "type": "" }]
  
  -- Contadores
  comments_count INTEGER DEFAULT 0,
  attachments_count INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX idx_kanban_tasks_board_id ON kanban_tasks(board_id);
CREATE INDEX idx_kanban_tasks_position ON kanban_tasks(column_id, position);
CREATE INDEX idx_kanban_tasks_created_by ON kanban_tasks(created_by);
CREATE INDEX idx_kanban_tasks_client_id ON kanban_tasks(client_id);
CREATE INDEX idx_kanban_tasks_due_date ON kanban_tasks(due_date);
CREATE INDEX idx_kanban_tasks_priority ON kanban_tasks(priority);
```

### 6.5 Tabela: `kanban_task_comments`
**Descrição**: Comentários em tarefas do Kanban

```sql
CREATE TABLE kanban_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES kanban_tasks(id) ON DELETE CASCADE NOT NULL,
  
  -- Autor
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Resposta a outro comentário
  parent_comment_id UUID REFERENCES kanban_task_comments(id) ON DELETE CASCADE,
  
  -- Edição
  is_edited BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_kanban_task_comments_task_id ON kanban_task_comments(task_id);
CREATE INDEX idx_kanban_task_comments_user_id ON kanban_task_comments(user_id);
CREATE INDEX idx_kanban_task_comments_parent ON kanban_task_comments(parent_comment_id);
```

### 6.6 Tabela: `kanban_task_history`
**Descrição**: Histórico de mudanças nas tarefas

```sql
CREATE TABLE kanban_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES kanban_tasks(id) ON DELETE CASCADE NOT NULL,
  
  -- Usuário que fez a mudança
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Tipo de ação
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'created', 'moved', 'assigned', 'unassigned', 'priority_changed', 
    'due_date_changed', 'title_changed', 'description_changed', 
    'label_added', 'label_removed', 'completed', 'archived'
  )),
  
  -- Detalhes da mudança
  old_value JSONB,
  new_value JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_kanban_task_history_task_id ON kanban_task_history(task_id);
CREATE INDEX idx_kanban_task_history_user_id ON kanban_task_history(user_id);
CREATE INDEX idx_kanban_task_history_created_at ON kanban_task_history(created_at DESC);
```

---

## 7. MÓDULO DE MENSAGENS E COMUNICAÇÃO

### 7.1 Tabela: `message_groups`
**Descrição**: Grupos de mensagens (canais/grupos de trabalho)

```sql
CREATE TABLE message_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Tipo de grupo
  group_type VARCHAR(30) DEFAULT 'team' CHECK (group_type IN ('team', 'project', 'client', 'general', 'announcement')),
  
  -- Avatar do grupo
  avatar_url TEXT,
  
  -- Configurações
  is_private BOOLEAN DEFAULT false,
  allow_external_members BOOLEAN DEFAULT false,
  
  -- Projeto relacionado (opcional)
  project_id UUID REFERENCES kanban_boards(id) ON DELETE SET NULL,
  
  -- Cliente relacionado (opcional)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Criação
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  
  -- Mensagens fixadas
  pinned_message_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Configurações adicionais
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_message_groups_type ON message_groups(group_type);
CREATE INDEX idx_message_groups_project_id ON message_groups(project_id);
CREATE INDEX idx_message_groups_client_id ON message_groups(client_id);
CREATE INDEX idx_message_groups_active ON message_groups(is_active) WHERE is_active = true;
```

### 7.2 Tabela: `message_group_members`
**Descrição**: Membros dos grupos de mensagens

```sql
CREATE TABLE message_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES message_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Role no grupo
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_muted BOOLEAN DEFAULT false,
  
  -- Leitura
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unread_count INTEGER DEFAULT 0,
  
  -- Notificações
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_message_group_members_group_id ON message_group_members(group_id);
CREATE INDEX idx_message_group_members_user_id ON message_group_members(user_id);
CREATE INDEX idx_message_group_members_active ON message_group_members(is_active) WHERE is_active = true;
```

### 7.3 Tabela: `direct_conversations`
**Descrição**: Conversas diretas entre dois usuários (DM)

```sql
CREATE TABLE direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participantes (sempre 2)
  user1_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Indicação se é conversa com cliente
  is_client_conversation BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Última mensagem
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Garante ordem consistente
);

CREATE INDEX idx_direct_conversations_user1 ON direct_conversations(user1_id);
CREATE INDEX idx_direct_conversations_user2 ON direct_conversations(user2_id);
CREATE INDEX idx_direct_conversations_client ON direct_conversations(is_client_conversation) WHERE is_client_conversation = true;
```

### 7.4 Tabela: `direct_conversation_status`
**Descrição**: Status de leitura individual em conversas diretas

```sql
CREATE TABLE direct_conversation_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Leitura
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unread_count INTEGER DEFAULT 0,
  
  -- Notificações
  is_muted BOOLEAN DEFAULT false,
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_direct_conversation_status_conversation_id ON direct_conversation_status(conversation_id);
CREATE INDEX idx_direct_conversation_status_user_id ON direct_conversation_status(user_id);
```

### 7.5 Tabela: `messages`
**Descrição**: Mensagens (grupos e diretas)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento (grupo ou conversa direta)
  group_id UUID REFERENCES message_groups(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE,
  
  -- Remetente
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Tipo de mensagem
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'audio', 'system', 'location', 'contact')),
  
  -- Anexos
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ "id": "", "name": "", "url": "", "size": 0, "type": "", "thumbnail": "" }]
  
  -- Resposta a outra mensagem
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Edição
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Exclusão
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Leitura (para mensagens diretas - array de user_ids)
  read_by JSONB DEFAULT '[]'::jsonb,
  
  -- Reações
  reactions JSONB DEFAULT '{}'::jsonb,
  -- Formato: { "emoji": ["user_id_1", "user_id_2"] }
  
  -- Mensagem fixada
  is_pinned BOOLEAN DEFAULT false,
  pinned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  pinned_at TIMESTAMP WITH TIME ZONE,
  
  -- Agendamento
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CHECK (
    (group_id IS NOT NULL AND conversation_id IS NULL) OR 
    (group_id IS NULL AND conversation_id IS NOT NULL)
  )
);

CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_reply_to ON messages(reply_to);
CREATE INDEX idx_messages_scheduled ON messages(is_scheduled, scheduled_for) WHERE is_scheduled = true;
```

### 7.6 Tabela: `message_reactions`
**Descrição**: Reações às mensagens

```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Emoji da reação
  emoji VARCHAR(10) NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
```

### 7.7 Tabela: `user_presence`
**Descrição**: Status de presença online dos usuários

```sql
CREATE TABLE user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  
  -- Indicador "digitando"
  is_typing_in_group UUID REFERENCES message_groups(id) ON DELETE SET NULL,
  is_typing_in_conversation UUID REFERENCES direct_conversations(id) ON DELETE SET NULL,
  
  -- Timestamps
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);
```

### 7.8 Tabela: `message_notifications`
**Descrição**: Notificações de mensagens não lidas

```sql
CREATE TABLE message_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  
  -- Entrega
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Leitura
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, message_id)
);

CREATE INDEX idx_message_notifications_user_id ON message_notifications(user_id);
CREATE INDEX idx_message_notifications_message_id ON message_notifications(message_id);
CREATE INDEX idx_message_notifications_unread ON message_notifications(user_id, is_read) WHERE is_read = false;
```

---

## 8. MÓDULO DE ARQUIVOS E DOCUMENTOS

### 8.1 Tabela: `client_files`
**Descrição**: Arquivos enviados/compartilhados pelos clientes

```sql
CREATE TABLE client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações do arquivo
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL, -- em bytes
  file_type VARCHAR(100),
  file_extension VARCHAR(10),
  
  -- Storage
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(100) DEFAULT 'client-files',
  public_url TEXT,
  
  -- Categoria
  category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('reference', 'briefing', 'brand', 'content', 'contract', 'other')),
  
  -- Tags e descrição
  tags JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Upload
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  upload_status VARCHAR(20) DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_client_files_client_id ON client_files(client_id);
CREATE INDEX idx_client_files_category ON client_files(category);
CREATE INDEX idx_client_files_uploaded_by ON client_files(uploaded_by);
CREATE INDEX idx_client_files_active ON client_files(is_active) WHERE is_active = true;
```

### 8.2 Tabela: `file_access_log`
**Descrição**: Log de acessos a arquivos

```sql
CREATE TABLE file_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES client_files(id) ON DELETE CASCADE NOT NULL,
  
  -- Usuário que acessou
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Tipo de acesso
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'delete')),
  
  -- IP e localização
  ip_address INET,
  
  -- Timestamp
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_file_access_log_file_id ON file_access_log(file_id);
CREATE INDEX idx_file_access_log_user_id ON file_access_log(user_id);
CREATE INDEX idx_file_access_log_accessed_at ON file_access_log(accessed_at DESC);
```

---

## 9. MÓDULO DE CALENDÁRIO E EVENTOS

### 9.1 Tabela: `calendar_events`
**Descrição**: Eventos, reuniões e prazos no calendário

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Tipo de evento
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('company', 'client_meeting', 'internal_meeting', 'recording', 'deadline', 'webinar', 'training', 'holiday', 'other')),
  
  -- Data e hora
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  -- Localização
  location VARCHAR(255),
  meeting_link TEXT,
  is_online BOOLEAN DEFAULT false,
  
  -- Organizador
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Participantes (array de user_ids)
  participants JSONB DEFAULT '[]'::jsonb,
  
  -- Cliente relacionado
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Lembretes (minutos antes do evento)
  reminder_minutes JSONB DEFAULT '[15, 60]'::jsonb,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format
  
  -- Visibilidade
  is_public BOOLEAN DEFAULT false,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_calendar_events_organizer_id ON calendar_events(organizer_id);
CREATE INDEX idx_calendar_events_client_id ON calendar_events(client_id);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_start ON calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_end ON calendar_events(end_datetime);
CREATE INDEX idx_calendar_events_date_range ON calendar_events(start_datetime, end_datetime);
```

### 9.2 Tabela: `calendar_event_participants`
**Descrição**: Participantes e RSVP de eventos

```sql
CREATE TABLE calendar_event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- RSVP
  rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
  rsvp_at TIMESTAMP WITH TIME ZONE,
  
  -- Presença
  attended BOOLEAN,
  
  -- Timestamps
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_calendar_event_participants_event_id ON calendar_event_participants(event_id);
CREATE INDEX idx_calendar_event_participants_user_id ON calendar_event_participants(user_id);
CREATE INDEX idx_calendar_event_participants_rsvp ON calendar_event_participants(rsvp_status);
```

### 9.3 Tabela: `meeting_requests`
**Descrição**: Solicitações de reuniões

```sql
CREATE TABLE meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Solicitante e destinatário
  requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Cliente relacionado (se aplicável)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Informações da reunião
  title VARCHAR(255) NOT NULL,
  description TEXT,
  meeting_type VARCHAR(50),
  
  -- Datas propostas
  proposed_dates JSONB NOT NULL,
  -- Formato: ["2025-11-15T10:00:00Z", "2025-11-16T14:00:00Z"]
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'rescheduled', 'cancelled')),
  
  -- Data selecionada
  selected_date TIMESTAMP WITH TIME ZONE,
  
  -- Rejeição
  rejection_reason TEXT,
  
  -- Contraproposta
  counter_proposal_dates JSONB,
  
  -- Evento criado
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_meeting_requests_requester_id ON meeting_requests(requester_id);
CREATE INDEX idx_meeting_requests_target_id ON meeting_requests(target_id);
CREATE INDEX idx_meeting_requests_client_id ON meeting_requests(client_id);
CREATE INDEX idx_meeting_requests_status ON meeting_requests(status);
```

---

*Continua na PARTE 1C...*

