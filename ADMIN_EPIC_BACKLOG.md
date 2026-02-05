# Valle 360 — Backlog “Modo Épico” (Admin) — varredura de pendências

Este arquivo consolida **o que ainda está em mock/placeholder/sem API** no Admin para planejarmos a implementação completa **sem mexer em layout** (somente funcionalidade).

## Dashboard Admin
- **Botão “Ações Rápidas” (topo)**: corrigido (rola para a seção) — `src/app/admin/dashboard/page.tsx`

## Onboarding (primeiro acesso)
- **Modal cortado em telas menores**: corrigido (scroll interno + max-height + safe-area) — `src/components/tour/GuidedTour.tsx`

## Centro de Inteligência
- **Gerar Análise IA**: corrigido/diagnosticado (toasts + telemetria + auth via Bearer) — `src/app/admin/centro-inteligencia/page.tsx`, `src/app/api/ai/insights/route.ts`, `src/hooks/useAI.ts`
- **Observação**: para IA funcionar em produção, precisa `OPENAI_API_KEY` e sessão válida.

## Propostas (Comercial)
- **Gerar/Enviar Proposta**: corrigido (API alinhada à tabela `proposals`, payload aceitando `proposalId`/`proposal_id`, link retornado, UI mostra erro real) — `src/app/admin/comercial/propostas/page.tsx`, `src/app/api/proposals/send/route.ts`, `src/app/api/proposals/accept/route.ts`
- **Ponto a validar no Supabase**: schema de `proposals` (no repo) não possui `client_company/client_phone/notes`. Hoje a UI tenta inserir esses campos e cai em “modo demo” se o banco não tiver.

## Metas Inteligentes
- **Gerar Metas IA**: corrigido (chamada real `action: generate_all`, usa `employees` e persiste em `collaborator_goals`, depois recarrega a tela via API) — `src/app/admin/metas/page.tsx`, `src/app/api/goals/route.ts`, `src/lib/goals/goal-engine.ts`
- **Ponto a validar**: requer `SUPABASE_SERVICE_ROLE_KEY` para rodar no server com RLS ativado.

## Clientes (Admin)
- **Lista**: agora tenta buscar dados reais (fallback para mock) via `/api/admin/clients` — `src/app/admin/clientes/page.tsx`, `src/app/api/admin/clients/route.ts`
- **Ativar/Desativar**: implementado via `PUT /api/admin/clients` (tenta `users.account_status`, fallback `user_profiles.is_active`)
- **Salvar Features/Serviços**: implementado via `POST /api/admin/clients` usando `features` + `client_features`
- **Pendências identificadas**:
  - Melhorar mapeamento “status/valor mensal” dependendo do schema real (há múltiplas migrations no repo).

## Colaboradores (Admin)
- **Lista**: agora tenta buscar dados reais (fallback para mock) via `/api/admin/employees` — `src/app/admin/colaboradores/page.tsx`, `src/app/api/admin/employees/route.ts`
- **Pendências identificadas**:
  - Enriquecer `performanceScore/deliveries/retention/clientsAssigned` com dados reais (hoje 0).

## Integrações / API / N8N
- Placeholders de UI detectados:
  - “Modal de configuração de webhook abrindo...” — `src/app/admin/integracoes/api/page.tsx`
  - Conteúdo de logs/endpoints é majoritariamente mock

## RH (Admin)
- Placeholders detectados:
  - Ações de “abrir email/chat/PDI/reajuste/relatório” são toasts — `src/app/admin/rh/colaborador/[id]/page.tsx`
  - Reunião/reagendamento e “Plano atualizado!” são toasts — `src/app/admin/rh/inteligencia/page.tsx`

## Contratos / Franqueados
- TODOs detectados:
  - “Implementar formulário de novo contrato” — `src/app/admin/contratos/page.tsx`
  - “Implementar API call” (franqueados) — `src/app/admin/franqueados/page.tsx`

## Observabilidade
- **Toaster global (Sonner)**: adicionado para que todos `toast.*` apareçam — `src/app/layout.tsx`, `src/components/providers/ToasterProvider.tsx`
- **Telemetria server-side**: endpoint `/api/telemetry` — `src/app/api/telemetry/route.ts`, helper `src/lib/telemetry/client.ts`

## Próximo passo sugerido (para planejamento)
1. Confirmar qual conjunto de migrations/schema está ativo no Supabase (há variações no repo).
2. Priorizar os módulos com placeholders críticos (Integrações API, RH, Contratos, Franqueados) e substituir por chamadas reais/persistência.


