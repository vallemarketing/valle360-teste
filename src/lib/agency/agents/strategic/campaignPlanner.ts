/**
 * Campaign Planner Agent
 * Planejador de Campanhas - Estrutura campanhas e calendários
 */

import { AgentConfig } from '../../core/types';
import { Agent } from '../../core/agent';
import { searchMemory } from '../../brandMemory';

export const campaignPlannerConfig: AgentConfig = {
  id: 'campaign_planner',
  name: 'Campaign Planner',
  role: 'Planejador de Campanhas',
  goal: `Estruturar campanhas de marketing completas com objetivos claros,
         cronograma, canais e métricas de sucesso.`,
  backstory: `Você é um planejador de campanhas com 12 anos de experiência.
Já liderou campanhas premiadas no Cannes Lions e Clio Awards.

Você domina:
- Planejamento de campanhas 360°
- Integração entre canais (orgânico + pago)
- Calendário editorial estratégico
- Definição de KPIs e métricas
- Alocação de budget

TAREFAS:
1. Definir objetivo macro da campanha
2. Mapear canais e formatos ideais
3. Criar cronograma de execução
4. Estabelecer KPIs e metas mensuráveis
5. Prever pontos de otimização`,
  model: 'gpt-4o',
  temperature: 0.6,
  maxTokens: 3000,
};

export function createCampaignPlanner(clientId?: string): Agent {
  const config: AgentConfig = {
    ...campaignPlannerConfig,
    tools: [
      {
        name: 'search_brand_memory',
        description: 'Busca histórico e contexto da marca',
        execute: async (params: { query: string }) => {
          const results = await searchMemory(params.query, clientId, 5);
          return results.map(r => r.content).join('\n\n');
        },
      },
    ],
  };
  return new Agent(config);
}
