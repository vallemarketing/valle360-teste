-- Tabela de Feedback NPS
CREATE TABLE IF NOT EXISTS nps_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Quem recebeu o feedback (colaborador)
    client_id UUID REFERENCES clients(id),  -- Cliente que deu o feedback (se existir tabela clients)
    card_id TEXT, -- ID da tarefa relacionada
    score INTEGER CHECK (score >= 0 AND score <= 10),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Alertas de Risco (para uso no Dashboard Inteligente)
CREATE TABLE IF NOT EXISTS smart_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT CHECK (type IN ('risk', 'opportunity', 'performance')),
    message TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para simular envio de NPS quando move para Done
CREATE OR REPLACE FUNCTION trigger_nps_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Lógica: Quando card for movido para 'done' (concluído)
    IF NEW.column_id = 'done' AND OLD.column_id != 'done' THEN
        -- Em um sistema real, aqui dispararia um email ou notification
        -- Como estamos simulando, vamos registrar um log ou alerta
        INSERT INTO smart_alerts (user_id, type, message, severity)
        VALUES (
            NEW.assignee_id, 
            'opportunity', 
            'Tarefa concluída. Pesquisa de NPS enviada ao cliente.', 
            'low'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_nps_on_complete ON kanban_tasks;

CREATE TRIGGER trg_nps_on_complete
AFTER UPDATE OF column_id ON kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_nps_request();

