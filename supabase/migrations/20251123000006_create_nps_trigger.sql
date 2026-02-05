-- Trigger para NPS Automático
-- Quando uma tarefa é movida para 'done', insere um registro pendente na tabela nps_surveys

CREATE TABLE IF NOT EXISTS nps_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES kanban_tasks(id),
    respondent_email TEXT, -- Quem pediu a tarefa
    score INTEGER,
    comment TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, responded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION trigger_nps_survey()
RETURNS TRIGGER AS $$
BEGIN
    -- Se moveu para 'done'
    IF NEW.column_id = 'done' AND OLD.column_id != 'done' THEN
        INSERT INTO nps_surveys (task_id, status)
        VALUES (NEW.id, 'pending');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nps_survey ON kanban_tasks;

CREATE TRIGGER trg_nps_survey
AFTER UPDATE OF column_id ON kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_nps_survey();

