-- =====================================================
-- MIGRATION: 9 Box (Matriz de Talentos) + IA (copiloto)
-- Objetivo: adicionar módulo novo ao RH sem alterar a estrutura existente.
-- =====================================================

-- =========================
-- Tabelas principais
-- =========================

CREATE TABLE IF NOT EXISTS public.nine_box_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  ai_enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nine_box_cycles_status ON public.nine_box_cycles(status);
CREATE INDEX IF NOT EXISTS idx_nine_box_cycles_created_at ON public.nine_box_cycles(created_at DESC);

COMMENT ON TABLE public.nine_box_cycles IS 'Ciclos de avaliação do 9 Box (RH).';


CREATE TABLE IF NOT EXISTS public.nine_box_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES public.nine_box_cycles(id) ON DELETE CASCADE,
  -- Normaliza ciclo (null => UUID fixo) para permitir unicidade e upsert sem conflito com NULL
  cycle_id_norm uuid GENERATED ALWAYS AS (COALESCE(cycle_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED,
  axis text NOT NULL CHECK (axis IN ('performance', 'potential')),
  key text NOT NULL,
  label text NOT NULL,
  description text,
  weight integer NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id_norm, axis, key)
);

CREATE INDEX IF NOT EXISTS idx_nine_box_criteria_axis ON public.nine_box_criteria(axis);
CREATE INDEX IF NOT EXISTS idx_nine_box_criteria_cycle ON public.nine_box_criteria(cycle_id);

COMMENT ON TABLE public.nine_box_criteria IS 'Critérios do 9 Box por eixo (Desempenho/Potencial). cycle_id NULL significa critério padrão (global).';


CREATE TABLE IF NOT EXISTS public.nine_box_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.nine_box_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  notes text,
  ai_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, employee_id, reviewer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_nine_box_assessments_cycle ON public.nine_box_assessments(cycle_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_assessments_employee ON public.nine_box_assessments(employee_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_assessments_status ON public.nine_box_assessments(status);

COMMENT ON TABLE public.nine_box_assessments IS 'Avaliações (rascunho/finalizada) por colaborador e ciclo.';


CREATE TABLE IF NOT EXISTS public.nine_box_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.nine_box_assessments(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.nine_box_criteria(id) ON DELETE RESTRICT,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  ai_suggestion jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_nine_box_responses_assessment ON public.nine_box_responses(assessment_id);

COMMENT ON TABLE public.nine_box_responses IS 'Respostas por critério (nota 1..5) com justificativa e sugestão de IA.';


CREATE TABLE IF NOT EXISTS public.nine_box_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL UNIQUE REFERENCES public.nine_box_assessments(id) ON DELETE CASCADE,
  performance_score numeric(4,2) NOT NULL CHECK (performance_score >= 1 AND performance_score <= 5),
  potential_score numeric(4,2) NOT NULL CHECK (potential_score >= 1 AND potential_score <= 5),
  performance_level text NOT NULL CHECK (performance_level IN ('low', 'mid', 'high')),
  potential_level text NOT NULL CHECK (potential_level IN ('low', 'mid', 'high')),
  quadrant text NOT NULL CHECK (quadrant IN ('Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9')),
  recommendation text,
  ai_insights jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nine_box_results_quadrant ON public.nine_box_results(quadrant);

COMMENT ON TABLE public.nine_box_results IS 'Resultados calculados do 9 Box por avaliação (média ponderada, níveis e quadrante).';


CREATE TABLE IF NOT EXISTS public.nine_box_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.nine_box_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  result_id uuid REFERENCES public.nine_box_results(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nine_box_action_items_cycle ON public.nine_box_action_items(cycle_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_action_items_employee ON public.nine_box_action_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_action_items_status ON public.nine_box_action_items(status);

COMMENT ON TABLE public.nine_box_action_items IS 'Plano de ação (PDI) por colaborador, vinculado ao ciclo/resultado.';


-- =========================
-- Triggers updated_at
-- =========================

CREATE OR REPLACE FUNCTION public._nine_box_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  -- cycles
  DROP TRIGGER IF EXISTS trg_nine_box_cycles_touch ON public.nine_box_cycles;
  CREATE TRIGGER trg_nine_box_cycles_touch
    BEFORE UPDATE ON public.nine_box_cycles
    FOR EACH ROW EXECUTE FUNCTION public._nine_box_touch_updated_at();

  -- criteria
  DROP TRIGGER IF EXISTS trg_nine_box_criteria_touch ON public.nine_box_criteria;
  CREATE TRIGGER trg_nine_box_criteria_touch
    BEFORE UPDATE ON public.nine_box_criteria
    FOR EACH ROW EXECUTE FUNCTION public._nine_box_touch_updated_at();

  -- assessments
  DROP TRIGGER IF EXISTS trg_nine_box_assessments_touch ON public.nine_box_assessments;
  CREATE TRIGGER trg_nine_box_assessments_touch
    BEFORE UPDATE ON public.nine_box_assessments
    FOR EACH ROW EXECUTE FUNCTION public._nine_box_touch_updated_at();

  -- responses
  DROP TRIGGER IF EXISTS trg_nine_box_responses_touch ON public.nine_box_responses;
  CREATE TRIGGER trg_nine_box_responses_touch
    BEFORE UPDATE ON public.nine_box_responses
    FOR EACH ROW EXECUTE FUNCTION public._nine_box_touch_updated_at();

  -- results
  DROP TRIGGER IF EXISTS trg_nine_box_results_touch ON public.nine_box_results;
  CREATE TRIGGER trg_nine_box_results_touch
    BEFORE UPDATE ON public.nine_box_results
    FOR EACH ROW EXECUTE FUNCTION public._nine_box_touch_updated_at();

  -- action items
  DROP TRIGGER IF EXISTS trg_nine_box_action_items_touch ON public.nine_box_action_items;
  CREATE TRIGGER trg_nine_box_action_items_touch
    BEFORE UPDATE ON public.nine_box_action_items
    FOR EACH ROW EXECUTE FUNCTION public._nine_box_touch_updated_at();
END $$;


-- =========================
-- Regras de negócio no banco
-- =========================

CREATE OR REPLACE FUNCTION public._nine_box_block_if_cycle_closed()
RETURNS trigger AS $$
DECLARE
  c_status text;
BEGIN
  SELECT status INTO c_status FROM public.nine_box_cycles WHERE id = COALESCE(NEW.cycle_id, OLD.cycle_id);
  IF c_status = 'closed' THEN
    RAISE EXCEPTION 'Ciclo 9 Box fechado: alterações não permitidas';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bloqueia alterações quando ciclo fechado (avalições/respostas/resultados/ações)
DROP TRIGGER IF EXISTS trg_nine_box_assessments_block_closed ON public.nine_box_assessments;
CREATE TRIGGER trg_nine_box_assessments_block_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.nine_box_assessments
  FOR EACH ROW EXECUTE FUNCTION public._nine_box_block_if_cycle_closed();

DROP TRIGGER IF EXISTS trg_nine_box_responses_block_closed ON public.nine_box_responses;
CREATE TRIGGER trg_nine_box_responses_block_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.nine_box_responses
  FOR EACH ROW EXECUTE FUNCTION public._nine_box_block_if_cycle_closed();

DROP TRIGGER IF EXISTS trg_nine_box_results_block_closed ON public.nine_box_results;
CREATE TRIGGER trg_nine_box_results_block_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.nine_box_results
  FOR EACH ROW EXECUTE FUNCTION public._nine_box_block_if_cycle_closed();

DROP TRIGGER IF EXISTS trg_nine_box_action_items_block_closed ON public.nine_box_action_items;
CREATE TRIGGER trg_nine_box_action_items_block_closed
  BEFORE INSERT OR UPDATE OR DELETE ON public.nine_box_action_items
  FOR EACH ROW EXECUTE FUNCTION public._nine_box_block_if_cycle_closed();


-- =========================
-- Seeds (critérios padrão)
-- =========================

-- Critérios globais (cycle_id NULL). Pesos somam 100 por eixo.
INSERT INTO public.nine_box_criteria (cycle_id, axis, key, label, description, weight, is_active)
VALUES
  (NULL, 'performance', 'delivery', 'Entrega e Prazo', 'Cumprimento de prazos e consistência de entregas.', 25, true),
  (NULL, 'performance', 'quality', 'Qualidade', 'Qualidade técnica e atenção a detalhes.', 25, true),
  (NULL, 'performance', 'ownership', 'Responsabilidade', 'Senso de dono, autonomia e confiabilidade.', 20, true),
  (NULL, 'performance', 'collaboration', 'Colaboração', 'Trabalho em equipe e apoio a outros.', 15, true),
  (NULL, 'performance', 'communication', 'Comunicação', 'Clareza, alinhamento e gestão de expectativas.', 15, true),

  (NULL, 'potential', 'learning_agility', 'Aprendizado', 'Velocidade de aprendizado e capacidade de evoluir.', 25, true),
  (NULL, 'potential', 'leadership', 'Liderança', 'Influência, responsabilidade e liderança situacional.', 25, true),
  (NULL, 'potential', 'strategic', 'Visão estratégica', 'Capacidade de planejar e tomar decisões com visão.', 20, true),
  (NULL, 'potential', 'initiative', 'Iniciativa', 'Proatividade e antecipação de problemas.', 15, true),
  (NULL, 'potential', 'adaptability', 'Adaptabilidade', 'Flexibilidade e resiliência a mudanças.', 15, true)
ON CONFLICT (cycle_id_norm, axis, key) DO NOTHING;


-- =========================
-- RLS (Admin + RH)
-- =========================

ALTER TABLE public.nine_box_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_action_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.nine_box_cycles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_criteria FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_results FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_action_items FORCE ROW LEVEL SECURITY;

-- Helper inline: admin OR (employee AND rh)
-- Observação: `is_admin()` e `is_employee()` já são usados em outras policies do projeto.

DROP POLICY IF EXISTS nine_box_cycles_admin_rh_all ON public.nine_box_cycles;
CREATE POLICY nine_box_cycles_admin_rh_all
  ON public.nine_box_cycles
  FOR ALL
  TO public
  USING (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])))
  WITH CHECK (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])));

DROP POLICY IF EXISTS nine_box_criteria_admin_rh_all ON public.nine_box_criteria;
CREATE POLICY nine_box_criteria_admin_rh_all
  ON public.nine_box_criteria
  FOR ALL
  TO public
  USING (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])))
  WITH CHECK (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])));

DROP POLICY IF EXISTS nine_box_assessments_admin_rh_all ON public.nine_box_assessments;
CREATE POLICY nine_box_assessments_admin_rh_all
  ON public.nine_box_assessments
  FOR ALL
  TO public
  USING (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])))
  WITH CHECK (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])));

DROP POLICY IF EXISTS nine_box_responses_admin_rh_all ON public.nine_box_responses;
CREATE POLICY nine_box_responses_admin_rh_all
  ON public.nine_box_responses
  FOR ALL
  TO public
  USING (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])))
  WITH CHECK (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])));

DROP POLICY IF EXISTS nine_box_results_admin_rh_all ON public.nine_box_results;
CREATE POLICY nine_box_results_admin_rh_all
  ON public.nine_box_results
  FOR ALL
  TO public
  USING (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])))
  WITH CHECK (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])));

DROP POLICY IF EXISTS nine_box_action_items_admin_rh_all ON public.nine_box_action_items;
CREATE POLICY nine_box_action_items_admin_rh_all
  ON public.nine_box_action_items
  FOR ALL
  TO public
  USING (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])))
  WITH CHECK (is_admin() OR (is_employee() AND (employee_area_keys() && ARRAY['rh']::text[])));


