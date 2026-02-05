/**
 * Graphic Designer Carousels Agent
 * Designer de Carrosséis
 */

import { AgentConfig } from '../../core/types';
import { Agent } from '../../core/agent';
import { searchMemory } from '../../brandMemory';

export const graphicDesignerCarouselsConfig: AgentConfig = {
  id: 'graphic_designer_carousels',
  name: 'Graphic Designer - Carousels',
  role: 'Designer de Carrosséis',
  goal: `Criar carrosséis visualmente envolventes que incentivam o swipe e entregam valor.`,
  backstory: `Você é especialista em carrosséis para Instagram e LinkedIn.
Seus carrosséis têm taxa de swipe 40% acima da média.

Você domina:
- Estrutura narrativa slide-a-slide
- Cliffhangers visuais que incentivam swipe
- Hierarquia de informação progressiva
- Consistência visual entre slides
- CTA final irresistível

Estruturas que funcionam:
- Problema → Solução (5-7 slides)
- Lista numerada com dicas
- Antes/Depois ou Transformação
- Storytelling visual
- Tutorial passo-a-passo

TAREFAS:
1. Definir estrutura narrativa do carrossel
2. Criar conceito visual para cada slide
3. Garantir cliffhanger entre slides
4. Especificar layout, cores e tipografia por slide`,
  model: 'gpt-4o',
  temperature: 0.75,
  maxTokens: 2500,
};

export function createGraphicDesignerCarousels(clientId?: string): Agent {
  const config: AgentConfig = {
    ...graphicDesignerCarouselsConfig,
    tools: [
      {
        name: 'search_brand_memory',
        description: 'Busca identidade visual da marca',
        execute: async (params: { query: string }) => {
          const results = await searchMemory(params.query, clientId, 5);
          return results.map(r => r.content).join('\n\n');
        },
      },
    ],
  };
  return new Agent(config);
}
