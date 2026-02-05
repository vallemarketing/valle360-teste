/*
  # Valle 360 - Schema Completo do Sistema

  ## Novas Tabelas
  
  ### 1. Pessoas (pessoas)
  - id, user_id, nome, email, telefone, cargo, departamento, tipo, avatar_url, status
  
  ### 2. Projetos (projetos)
  - id, nome, descricao, cliente_id, status, data_inicio, data_fim, valor
  
  ### 3. Tarefas (tarefas)
  - id, projeto_id, titulo, descricao, responsavel_id, status, prioridade, data_inicio, data_fim, ordem
  
  ### 4. Transações (transacoes)
  - id, projeto_id, tipo, categoria, descricao, valor, data, status
  
  ### 5. Mensagens (mensagens)
  - id, remetente_id, destinatario_id, assunto, conteudo, lida
  
  ### 6. Eventos (eventos)
  - id, titulo, descricao, data_inicio, data_fim, responsavel_id, participantes, tipo

  ## Segurança
  - Todas as tabelas têm RLS habilitado
  - Colaboradores têm acesso completo
  - Clientes veem apenas seus próprios dados
*/

-- Criar tabela de pessoas
CREATE TABLE IF NOT EXISTS pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  cargo text,
  departamento text,
  tipo text NOT NULL CHECK (tipo IN ('colaborador', 'cliente')),
  avatar_url text,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cliente_id uuid REFERENCES pessoas(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'concluido', 'cancelado')),
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  valor numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid REFERENCES projetos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  responsavel_id uuid REFERENCES pessoas(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'em_andamento', 'concluido')),
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  data_inicio date,
  data_fim date,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid REFERENCES projetos(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria text NOT NULL,
  descricao text NOT NULL,
  valor numeric(12, 2) NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id uuid REFERENCES pessoas(id) ON DELETE CASCADE,
  destinatario_id uuid REFERENCES pessoas(id) ON DELETE CASCADE,
  assunto text NOT NULL,
  conteudo text NOT NULL,
  lida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz NOT NULL,
  responsavel_id uuid REFERENCES pessoas(id) ON DELETE SET NULL,
  participantes uuid[],
  tipo text NOT NULL DEFAULT 'evento' CHECK (tipo IN ('reuniao', 'prazo', 'evento')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Políticas para pessoas
CREATE POLICY "Colaboradores podem ver todas as pessoas"
  ON pessoas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Clientes podem ver apenas seu próprio perfil"
  ON pessoas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Colaboradores podem inserir pessoas"
  ON pessoas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Colaboradores podem atualizar pessoas"
  ON pessoas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

-- Políticas para projetos
CREATE POLICY "Colaboradores podem ver todos os projetos"
  ON projetos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Clientes podem ver apenas seus projetos"
  ON projetos FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM pessoas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores podem inserir projetos"
  ON projetos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Colaboradores podem atualizar projetos"
  ON projetos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

-- Políticas para tarefas
CREATE POLICY "Colaboradores podem ver todas as tarefas"
  ON tarefas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Colaboradores podem inserir tarefas"
  ON tarefas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Colaboradores podem atualizar tarefas"
  ON tarefas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Colaboradores podem deletar tarefas"
  ON tarefas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

-- Políticas para transações
CREATE POLICY "Colaboradores podem ver todas as transações"
  ON transacoes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Clientes podem ver transações de seus projetos"
  ON transacoes FOR SELECT
  TO authenticated
  USING (
    projeto_id IN (
      SELECT projetos.id FROM projetos
      INNER JOIN pessoas ON projetos.cliente_id = pessoas.id
      WHERE pessoas.user_id = auth.uid()
    )
  );

CREATE POLICY "Colaboradores podem inserir transações"
  ON transacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Colaboradores podem atualizar transações"
  ON transacoes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

-- Políticas para mensagens
CREATE POLICY "Usuários podem ver mensagens enviadas ou recebidas"
  ON mensagens FOR SELECT
  TO authenticated
  USING (
    remetente_id IN (SELECT id FROM pessoas WHERE user_id = auth.uid())
    OR destinatario_id IN (SELECT id FROM pessoas WHERE user_id = auth.uid())
  );

CREATE POLICY "Usuários podem enviar mensagens"
  ON mensagens FOR INSERT
  TO authenticated
  WITH CHECK (
    remetente_id IN (SELECT id FROM pessoas WHERE user_id = auth.uid())
  );

CREATE POLICY "Usuários podem atualizar suas mensagens recebidas"
  ON mensagens FOR UPDATE
  TO authenticated
  USING (
    destinatario_id IN (SELECT id FROM pessoas WHERE user_id = auth.uid())
  );

-- Políticas para eventos
CREATE POLICY "Colaboradores podem ver todos os eventos"
  ON eventos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Usuários podem ver eventos em que participam"
  ON eventos FOR SELECT
  TO authenticated
  USING (
    (SELECT id FROM pessoas WHERE user_id = auth.uid()) = ANY(participantes)
  );

CREATE POLICY "Colaboradores podem inserir eventos"
  ON eventos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

CREATE POLICY "Colaboradores podem atualizar eventos"
  ON eventos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'colaborador'
    )
  );

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pessoas_user_id ON pessoas(user_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo ON pessoas(tipo);
CREATE INDEX IF NOT EXISTS idx_projetos_cliente_id ON projetos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON projetos(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_projeto_id ON tarefas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel_id ON tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_projeto_id ON transacoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente_id ON mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario_id ON mensagens(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_responsavel_id ON eventos(responsavel_id);
