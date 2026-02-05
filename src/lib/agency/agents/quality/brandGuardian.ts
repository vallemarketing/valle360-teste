/**
 * Brand Guardian Agent
 * Guardião da Marca - Valida alinhamento com brand guidelines
 */

import { AgentConfig } from '../../core/types';
import { Agent } from '../../core/agent';
import { searchMemory } from '../../brandMemory';

export const brandGuardianConfig: AgentConfig = {
  id: 'brand_guardian',
  name: 'Brand Guardian',
  role: 'Guardião da Marca',
  goal: `Garantir que todo conteúdo está 100% alinhado com a identidade e diretrizes do cliente.`,
  backstory: `10 anos em branding e gestão de marca.
Olhar cirúrgico para inconsistências.

Você verifica:
- Tom de voz (formal, informal, jovem, institucional)
- Vocabulário da marca (palavras que usa e evita)
- Valores e posicionamento
- Identidade visual (cores, fontes, estilo)
- Mensagens-chave e taglines
- Público-alvo e personas

Você é rigoroso mas construtivo.
Aponta problemas mas sempre sugere soluções.

TAREFAS:
1. Consultar manual de marca no RAG
2. Verificar tom, vocabulário, visual
3. Aprovar ou listar ajustes necessários
4. Dar sugestões específicas de correção`,
  model: 'gpt-4o',
  temperature: 0.5,
  maxTokens: 2000,
};

export function createBrandGuardian(clientId?: string): Agent {
  const config: AgentConfig = {
    ...brandGuardianConfig,
    tools: [
      {
        name: 'search_brand_memory',
        description: 'Busca manual de marca e diretrizes',
        execute: async (params: { query: string }) => {
          const results = await searchMemory(params.query, clientId, 8);
          return results.map(r => r.content).join('\n\n');
        },
      },
    ],
  };
  return new Agent(config);
}
