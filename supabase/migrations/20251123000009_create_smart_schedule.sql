-- Função para encontrar a próxima data disponível (Smart Schedule)
-- Evita sobrecarregar o colaborador no mesmo dia (Limita a 3 entregas por dia)
CREATE OR REPLACE FUNCTION find_next_available_date(worker_id UUID, preferred_date DATE)
RETURNS DATE AS $$
DECLARE
    candidate_date DATE := preferred_date;
    tasks_count INT;
    max_tasks_per_day INT := 3; -- Configuração: Máximo de entregas por dia
    safety_counter INT := 0;
BEGIN
    LOOP
        -- Verificar dia da semana (0 = Domingo, 6 = Sábado)
        -- Pular finais de semana
        IF EXTRACT(DOW FROM candidate_date) = 0 THEN
            candidate_date := candidate_date + 1; -- Mover para Segunda
            CONTINUE;
        ELSIF EXTRACT(DOW FROM candidate_date) = 6 THEN
            candidate_date := candidate_date + 2; -- Mover para Segunda
            CONTINUE;
        END IF;

        -- Contar tarefas agendadas para esse dia para esse user
        SELECT COUNT(*) INTO tasks_count
        FROM kanban_tasks
        WHERE assignee_id = worker_id 
        AND due_date = candidate_date
        AND status NOT IN ('done', 'archived');

        -- Se tiver vaga, retorna a data
        IF tasks_count < max_tasks_per_day THEN
            RETURN candidate_date;
        END IF;

        -- Se não, tenta o próximo dia
        candidate_date := candidate_date + 1;
        safety_counter := safety_counter + 1;

        -- Evitar loop infinito (limite de 30 dias de busca)
        IF safety_counter > 30 THEN
            RETURN preferred_date + 1; -- Desiste e retorna dia seguinte como fallback
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar o Trigger de Distribuição para usar o Smart Schedule
CREATE OR REPLACE FUNCTION distribute_contract_tasks()
RETURNS TRIGGER AS $$
DECLARE
    proposal_data JSONB;
    service_item JSONB;
    deliverables JSONB;
    deliverable_key TEXT;
    deliverable_count INT;
    i INT;
    new_task_id UUID;
    target_column_id TEXT;
    assignee_id UUID;
    base_start_date DATE;
    smart_due_date DATE;
    client_name_var TEXT;
BEGIN
    -- Apenas executa se o contrato for novo ou ativado
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.active = TRUE AND OLD.active = FALSE) THEN
        
        -- Buscar dados da proposta associada e nome do cliente
        SELECT items, client_name INTO proposal_data, client_name_var FROM proposals WHERE id = NEW.proposal_id;
        
        -- Loop pelos serviços da proposta
        FOR service_item IN SELECT * FROM jsonb_array_elements(proposal_data)
        LOOP
            -- Buscar os entregáveis do serviço na tabela services
            SELECT deliverables INTO deliverables FROM services WHERE id = (service_item->>'id')::UUID;
            
            -- Se não encontrar deliverables, pular
            IF deliverables IS NULL THEN CONTINUE; END IF;

            -- Loop pelos tipos de entregáveis (ex: "videos", "posts")
            FOR deliverable_key, deliverable_count IN SELECT * FROM jsonb_each_text(deliverables)
            LOOP
                -- Definir responsável
                IF deliverable_key = 'videos' THEN
                    target_column_id := 'todo';
                    SELECT user_id INTO assignee_id FROM employees WHERE department = 'Audiovisual' LIMIT 1;
                ELSIF deliverable_key = 'posts' OR deliverable_key = 'stories' THEN
                    target_column_id := 'todo';
                     SELECT user_id INTO assignee_id FROM employees WHERE department = 'Design' LIMIT 1;
                ELSE
                     target_column_id := 'todo';
                     assignee_id := NEW.client_id;
                END IF;

                -- Criar N tarefas distribuídas ao longo do mês
                FOR i IN 1..deliverable_count::INT 
                LOOP
                    -- Data base sugerida (espalhamento semanal simples)
                    base_start_date := NEW.start_date + ((i - 1) * 7);
                    
                    -- Aplica Smart Schedule para encontrar data de entrega real sem conflito
                    -- Se não tiver assignee, usa a data base + 5
                    IF assignee_id IS NOT NULL THEN
                        smart_due_date := find_next_available_date(assignee_id, base_start_date + 5);
                    ELSE
                        smart_due_date := base_start_date + 5;
                    END IF;

                    INSERT INTO kanban_tasks (
                        title,
                        description,
                        status,
                        priority,
                        assignee_id,
                        column_id,
                        due_date,
                        area,
                        client_id
                    ) VALUES (
                        'Produzir ' || deliverable_key || ' #' || i || ' para ' || COALESCE(client_name_var, 'Cliente'),
                        'Tarefa gerada automaticamente pelo contrato #' || NEW.id,
                        'todo',
                        'medium',
                        assignee_id,
                        target_column_id,
                        smart_due_date,
                        CASE 
                            WHEN deliverable_key = 'videos' THEN 'Audiovisual'
                            ELSE 'Design'
                        END,
                        NEW.client_id
                    ) RETURNING id INTO new_task_id;
                    
                    RAISE NOTICE 'Tarefa criada com Smart Schedule: % para %', new_task_id, smart_due_date;

                END LOOP;
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

