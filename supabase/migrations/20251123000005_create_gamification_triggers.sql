-- Trigger para pontuação de produtividade automática (Gamificação)
CREATE OR REPLACE FUNCTION calculate_task_points()
RETURNS TRIGGER AS $$
DECLARE
    v_points INTEGER := 10; -- Pontos base por tarefa
    v_bonus INTEGER := 0;
BEGIN
    -- Se moveu para 'done' (concluído)
    IF NEW.column_id = 'done' AND OLD.column_id != 'done' THEN
        
        -- Bônus de velocidade (se feito em menos de 2 dias)
        IF (EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) < 172800) THEN
            v_bonus := 5;
        END IF;

        -- Inserir pontos na tabela de gamificação (se existir)
        -- Assumindo tabela employee_gamification
        BEGIN
            INSERT INTO employee_gamification (user_id, points, reason, created_at)
            VALUES (NEW.assignee_id, v_points + v_bonus, 'Tarefa Concluída: ' || NEW.title, NOW());
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Tabela pode não existir ainda
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gamification_points ON kanban_tasks;

CREATE TRIGGER trg_gamification_points
AFTER UPDATE OF column_id ON kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION calculate_task_points();

