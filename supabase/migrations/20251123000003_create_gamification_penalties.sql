-- Tabela de Penalidades de Gamificação
CREATE TABLE IF NOT EXISTS gamification_penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    card_id TEXT NOT NULL, -- ID do card que gerou a penalidade (texto para flexibilidade)
    penalty_type TEXT NOT NULL, -- 'delay', 'low_nps', 'bug_reopen'
    xp_deducted INTEGER NOT NULL,
    reason TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger function para aplicar penalidade por atraso
CREATE OR REPLACE FUNCTION apply_gamification_penalty()
RETURNS TRIGGER AS $$
DECLARE
    xp_loss INTEGER := 10; -- Perda padrão de XP por atraso
BEGIN
    -- Verifica se o card foi movido para uma coluna de 'done' (concluído)
    -- E se a data de conclusão é maior que a data de vencimento (due_date)
    -- Assumindo que 'done' ou 'completed' são IDs de colunas de finalização
    -- Ajuste os IDs das colunas conforme seu setup real
    IF (NEW.column_id IN ('done', 'completed', 'finalizado')) AND 
       (NEW.due_date IS NOT NULL) AND 
       (NOW() > NEW.due_date) THEN
        
        -- Inserir registro de penalidade
        INSERT INTO gamification_penalties (user_id, card_id, penalty_type, xp_deducted, reason, applied_at)
        VALUES (
            NEW.assignee_id, -- Assumindo que o card tem um assignee_id
            NEW.id::text,
            'delay',
            xp_loss,
            'Tarefa entregue com atraso',
            NOW()
        );

        -- Opcional: Atualizar saldo de XP do usuário em uma tabela de gamificação (se existir)
        -- UPDATE user_gamification SET current_xp = current_xp - xp_loss WHERE user_id = NEW.assignee_id;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela de tarefas (kanban_tasks)
-- Ajuste o nome da tabela se for diferente
DROP TRIGGER IF EXISTS trg_apply_gamification_penalty ON kanban_tasks;

CREATE TRIGGER trg_apply_gamification_penalty
AFTER UPDATE OF column_id ON kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION apply_gamification_penalty();
