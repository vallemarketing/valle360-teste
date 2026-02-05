-- Tabela para registrar métricas de movimentação do Kanban
CREATE TABLE IF NOT EXISTS kanban_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    from_column TEXT,
    to_column TEXT NOT NULL,
    duration_seconds INTEGER, -- Tempo que ficou na coluna anterior
    moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_kanban_metrics_card_id ON kanban_metrics(card_id);
CREATE INDEX IF NOT EXISTS idx_kanban_metrics_user_id ON kanban_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_metrics_moved_at ON kanban_metrics(moved_at);

-- Trigger function para calcular duração e inserir métrica
CREATE OR REPLACE FUNCTION log_kanban_movement()
RETURNS TRIGGER AS $$
DECLARE
    last_movement TIMESTAMP;
    duration INT;
BEGIN
    -- Tenta achar a última movimentação deste card
    SELECT moved_at INTO last_movement
    FROM kanban_metrics
    WHERE card_id = NEW.id::text -- Assumindo que NEW.id é o ID do card na tabela de origem (ex: kanban_tasks)
    ORDER BY moved_at DESC
    LIMIT 1;

    IF last_movement IS NOT NULL THEN
        duration := EXTRACT(EPOCH FROM (NOW() - last_movement));
    ELSE
        duration := 0; -- Primeira movimentação ou criação
    END IF;

    INSERT INTO kanban_metrics (card_id, user_id, from_column, to_column, duration_seconds, moved_at)
    VALUES (
        NEW.id::text,
        auth.uid(), -- ID do usuário que fez a ação
        OLD.column_id, -- Coluna anterior (assumindo campo column_id)
        NEW.column_id, -- Nova coluna
        duration,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger deve ser aplicado na tabela kanban_cards (ou nome similar no seu schema)
-- Como não tenho o nome exato da tabela de cards, vou criar uma tabela de exemplo e aplicar nela
-- Se já existir, o comando CREATE TABLE IF NOT EXISTS não fará nada (mas a estrutura precisa bater)

CREATE TABLE IF NOT EXISTS kanban_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    column_id TEXT NOT NULL,
    area TEXT NOT NULL,
    assignee_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_log_kanban_movement ON kanban_tasks;

CREATE TRIGGER trg_log_kanban_movement
AFTER UPDATE OF column_id ON kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION log_kanban_movement();

