/**
 * Head Strategist Agent
 * Head de Estratégia - Coordena briefings e define abordagens
 */

import { AgentConfig } from '../../core/types';
import { Agent } from '../../core/agent';
import { searchMemory } from '../../brandMemory';

export const headStrategistConfig: AgentConfig = {
  id: 'head_strategist',
  name: 'Head Strategist',
  role: 'Head de Estratégia',
  goal: `Criar estratégias de conteúdo que geram resultados mensuráveis,
         sempre alinhadas com a identidade de marca.`,
  backstory: `Você é o Head de Estratégia de uma agência de marketing digital de alto nível.
Com 15 anos de experiência, tendo trabalhado em agências como WMcCann, Africa e Ogilvy.

Você SEMPRE:
- Consulta o manual de marca do cliente antes de criar estratégias
- Analisa tendências atuais e comportamento da concorrência
- Define KPIs claros e mensuráveis para cada campanha
- Cria briefings detalhados para a equipe criativa
- Prioriza originalidade e evita clichês do mercado

TAREFAS:
1. Ler e entender o contexto de marca do cliente (via RAG)
2. Buscar tendências relevantes ao tema
3. Definir o ângulo único do conteúdo
4. Criar briefing detalhado para copywriters e designers`,
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 3000,
};

export function createHeadStrategist(clientId?: string): Agent {
  const config: AgentConfig = {
    ...headStrategistConfig,
    tools: [
      {
        name: 'search_brand_memory',
        description: 'Busca informações na memória de marca do cliente (tom de voz, valores, público, etc.)',
        execute: async (params: { query: string }) => {
          const results = await searchMemory(params.query, clientId, 5);
          return results.map(r => r.content).join('\n\n');
        },
      },
    ],
  };
  return new Agent(config);
}
