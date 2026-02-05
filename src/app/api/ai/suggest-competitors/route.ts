import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST: Sugerir concorrentes via IA
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { segment, industry, location } = body;

  if (!segment) {
    return NextResponse.json({ error: 'Segmento é obrigatório' }, { status: 400 });
  }

  try {
    // Buscar client_id
    const { data: client } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single();

    // Construir prompt para a IA
    const prompt = `
Você é um especialista em marketing digital brasileiro. 
Com base nas informações abaixo, liste 5 principais concorrentes no Instagram que o cliente deveria monitorar.

Informações do cliente:
- Segmento: ${segment}
- Nicho específico: ${industry || 'Não especificado'}
- Localização: ${location || 'Brasil'}
- Empresa: ${client?.company_name || 'Não especificado'}

Retorne um JSON com a seguinte estrutura:
{
  "competitors": [
    {
      "username": "@exemplo",
      "name": "Nome da Empresa",
      "reason": "Por que é um bom concorrente para monitorar",
      "followers_estimate": 10000,
      "category": "Categoria do negócio"
    }
  ]
}

Considere:
- Empresas do mesmo segmento
- Diferentes tamanhos (algumas maiores, algumas similares)
- Marcas com boa presença no Instagram
- Concorrentes diretos e indiretos
`;

    // Tentar usar OpenAI se disponível
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (openaiApiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'Você é um especialista em marketing digital e análise de concorrência. Responda sempre em JSON válido.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        const content = data.choices[0]?.message?.content;
        
        try {
          const parsed = JSON.parse(content);
          return NextResponse.json({ 
            success: true, 
            competitors: parsed.competitors || [],
            source: 'ai'
          });
        } catch (parseError) {
          console.error('Erro ao parsear resposta da IA:', parseError);
        }
      }
    }

    // Fallback: usar Tavily para buscar concorrentes
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    
    if (tavilyApiKey) {
      const searchQuery = `melhores empresas ${segment} ${industry || ''} Instagram Brasil`;
      
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: searchQuery,
          search_depth: 'advanced',
          max_results: 10,
          include_domains: ['instagram.com', 'forbes.com.br', 'exame.com', 'infomoney.com.br']
        })
      });

      if (tavilyResponse.ok) {
        const tavilyData = await tavilyResponse.json();
        
        // Extrair possíveis concorrentes dos resultados
        const extractedCompetitors = tavilyData.results
          ?.filter((r: any) => r.url?.includes('instagram.com'))
          ?.slice(0, 5)
          ?.map((r: any, index: number) => {
            const username = r.url?.split('instagram.com/')[1]?.split('/')[0] || `competitor${index + 1}`;
            return {
              username: `@${username}`,
              name: r.title || username,
              reason: 'Encontrado através de busca de mercado',
              followers_estimate: 10000 + (index * 5000),
              category: segment
            };
          }) || [];

        if (extractedCompetitors.length > 0) {
          return NextResponse.json({ 
            success: true, 
            competitors: extractedCompetitors,
            source: 'search'
          });
        }
      }
    }

    // Fallback final: sugestões genéricas baseadas no segmento
    const genericCompetitors = getGenericCompetitorsBySegment(segment);
    
    return NextResponse.json({ 
      success: true, 
      competitors: genericCompetitors,
      source: 'generic'
    });

  } catch (error: any) {
    console.error('Erro ao sugerir concorrentes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getGenericCompetitorsBySegment(segment: string): any[] {
  const segmentCompetitors: Record<string, any[]> = {
    'ecommerce': [
      { username: '@netshoes', name: 'Netshoes', reason: 'Referência em e-commerce esportivo', followers_estimate: 1500000, category: 'E-commerce' },
      { username: '@americanas', name: 'Americanas', reason: 'Grande player de marketplace', followers_estimate: 5000000, category: 'E-commerce' },
      { username: '@shopee_br', name: 'Shopee Brasil', reason: 'Líder em engajamento', followers_estimate: 8000000, category: 'E-commerce' },
    ],
    'food': [
      { username: '@iflodbr', name: 'iFood', reason: 'Líder em delivery', followers_estimate: 4000000, category: 'Alimentação' },
      { username: '@mcdonalds_br', name: 'McDonalds Brasil', reason: 'Referência em conteúdo', followers_estimate: 3500000, category: 'Alimentação' },
    ],
    'beauty': [
      { username: '@oboticario', name: 'O Boticário', reason: 'Líder em beleza', followers_estimate: 6000000, category: 'Beleza' },
      { username: '@sabordebeleza', name: 'Sabor de Beleza', reason: 'Influente no segmento', followers_estimate: 500000, category: 'Beleza' },
    ],
    'fashion': [
      { username: '@renlojas', name: 'Renner', reason: 'Referência em moda', followers_estimate: 4000000, category: 'Moda' },
      { username: '@zaaborjaz', name: 'Zara Brasil', reason: 'Fast fashion líder', followers_estimate: 2000000, category: 'Moda' },
    ],
    'tech': [
      { username: '@magazineluiza', name: 'Magazine Luiza', reason: 'Líder em tech retail', followers_estimate: 10000000, category: 'Tecnologia' },
      { username: '@kababorjaz', name: 'Kabum', reason: 'Referência em tech', followers_estimate: 1500000, category: 'Tecnologia' },
    ],
    'health': [
      { username: '@biolab', name: 'Biolab', reason: 'Referência em saúde', followers_estimate: 200000, category: 'Saúde' },
      { username: '@smartfit', name: 'Smart Fit', reason: 'Líder em fitness', followers_estimate: 2500000, category: 'Saúde' },
    ],
    'services': [
      { username: '@nubank', name: 'Nubank', reason: 'Referência em conteúdo B2C', followers_estimate: 5000000, category: 'Serviços' },
      { username: '@xpinvestimentos', name: 'XP Investimentos', reason: 'Líder em finanças', followers_estimate: 1500000, category: 'Serviços' },
    ],
  };

  // Retornar concorrentes do segmento ou genéricos
  return segmentCompetitors[segment] || [
    { username: '@exemplo1', name: 'Concorrente Exemplo 1', reason: 'Sugestão baseada no segmento', followers_estimate: 50000, category: segment },
    { username: '@exemplo2', name: 'Concorrente Exemplo 2', reason: 'Sugestão baseada no segmento', followers_estimate: 30000, category: segment },
    { username: '@exemplo3', name: 'Concorrente Exemplo 3', reason: 'Sugestão baseada no segmento', followers_estimate: 80000, category: segment },
  ];
}
