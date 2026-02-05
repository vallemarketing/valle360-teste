-- 5. Trigger para Distribuição de Tarefas Pós-Contrato (Orquestrador)
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
    start_date DATE;
    due_date DATE;
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
                -- Definir responsável e coluna baseado no tipo de entregável
                -- Lógica simplificada: Distribui para o usuário 'designer@valle360.com' ou 'video@valle360.com'
                
                IF deliverable_key = 'videos' THEN
                    target_column_id := 'todo'; -- Coluna inicial do Videomaker
                    -- Tentar achar videomaker (exemplo estático, ideal ser dinâmico)
                    SELECT user_id INTO assignee_id FROM employees WHERE department = 'Audiovisual' LIMIT 1;
                ELSIF deliverable_key = 'posts' OR deliverable_key = 'stories' THEN
                    target_column_id := 'todo'; -- Coluna inicial do Designer
                     SELECT user_id INTO assignee_id FROM employees WHERE department = 'Design' LIMIT 1;
                ELSE
                     target_column_id := 'todo';
                     assignee_id := NEW.client_id; -- Fallback (não ideal)
                END IF;

                -- Criar N tarefas distribuídas ao longo do mês (ciclo mensal assumido)
                FOR i IN 1..deliverable_count::INT 
                LOOP
                    -- Calcular datas (distribuição semanal simples)
                    start_date := NEW.start_date + ((i - 1) * 7); 
                    due_date := start_date + 5; -- Prazo de 5 dias

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
                        due_date,
                        CASE 
                            WHEN deliverable_key = 'videos' THEN 'Audiovisual'
                            ELSE 'Design'
                        END,
                        NEW.client_id
                    ) RETURNING id INTO new_task_id;
                    
                    -- Logar criação (opcional)
                    RAISE NOTICE 'Tarefa criada: %', new_task_id;

                END LOOP;
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger na tabela contracts
DROP TRIGGER IF EXISTS trg_distribute_tasks ON contracts;

CREATE TRIGGER trg_distribute_tasks
AFTER INSERT OR UPDATE OF active ON contracts
FOR EACH ROW
EXECUTE FUNCTION distribute_contract_tasks();
