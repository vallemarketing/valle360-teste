import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Buscar notícias do setor do cliente
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Buscar dados do cliente
    const { data: client } = await supabase
      .from('clients')
      .select('id, segment, industry')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar onboarding para pegar segmento se não estiver no cliente
    const { data: onboarding } = await supabase
      .from('client_onboarding')
      .select('segment, industry')
      .eq('client_id', client.id)
      .single();

    const segment = client.segment || onboarding?.segment || 'geral';
    const industry = client.industry || onboarding?.industry || '';

    // Tentar buscar notícias via Tavily
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    
    if (tavilyApiKey) {
      const searchQuery = `tendências marketing digital ${getSegmentLabel(segment)} ${industry} ${new Date().getFullYear()} Brasil`;
      
      try {
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: searchQuery,
            search_depth: 'basic',
            max_results: 8,
            include_domains: [
              'g1.globo.com', 
              'forbes.com.br', 
              'exame.com', 
              'infomoney.com.br',
              'meioemensagem.com.br',
              'propmark.com.br',
              'rockcontent.com',
              'resultadosdigitais.com.br'
            ]
          })
        });

        if (tavilyResponse.ok) {
          const data = await tavilyResponse.json();
          
          const news = data.results?.map((item: any, index: number) => ({
            id: `news-${index}`,
            title: item.title,
            summary: item.content?.substring(0, 200) + '...',
            url: item.url,
            source: extractDomain(item.url),
            published_at: item.published_date || new Date().toISOString(),
            image_url: item.raw_content?.match(/<img[^>]+src="([^">]+)"/)?.[1] || null,
            relevance_score: item.score || 0.5,
            category: segment
          })) || [];

          return NextResponse.json({ 
            success: true, 
            news,
            segment: getSegmentLabel(segment),
            source: 'tavily'
          });
        }
      } catch (tavilyError) {
        console.error('Erro Tavily:', tavilyError);
      }
    }

    // Fallback: notícias genéricas baseadas no segmento
    const fallbackNews = getFallbackNews(segment);
    
    return NextResponse.json({ 
      success: true, 
      news: fallbackNews,
      segment: getSegmentLabel(segment),
      source: 'fallback'
    });

  } catch (error: any) {
    console.error('Erro ao buscar notícias:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return 'Fonte desconhecida';
  }
}

function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    'ecommerce': 'E-commerce',
    'food': 'Alimentação',
    'beauty': 'Beleza & Estética',
    'health': 'Saúde & Bem-estar',
    'education': 'Educação',
    'tech': 'Tecnologia',
    'fashion': 'Moda',
    'real-estate': 'Imobiliário',
    'automotive': 'Automotivo',
    'entertainment': 'Entretenimento',
    'services': 'Serviços',
  };
  return labels[segment] || 'Negócios';
}

function getFallbackNews(segment: string): any[] {
  const baseNews = [
    {
      id: 'news-1',
      title: 'Instagram lança novas ferramentas para criadores de conteúdo',
      summary: 'A Meta anunciou uma série de novidades para o Instagram, incluindo novas formas de monetização e ferramentas de análise para criadores.',
      url: 'https://about.meta.com/news',
      source: 'Meta',
      published_at: new Date().toISOString(),
      category: 'redes sociais'
    },
    {
      id: 'news-2',
      title: 'Marketing de influência cresce 30% no Brasil',
      summary: 'Estudo revela que investimentos em marketing de influência no país cresceram significativamente, com destaque para microinfluenciadores.',
      url: 'https://meioemensagem.com.br',
      source: 'Meio & Mensagem',
      published_at: new Date(Date.now() - 86400000).toISOString(),
      category: 'tendências'
    },
    {
      id: 'news-3',
      title: 'Reels supera TikTok em engajamento orgânico',
      summary: 'Análise mostra que o formato de vídeos curtos do Instagram está gerando mais engajamento que o concorrente em algumas categorias.',
      url: 'https://rockcontent.com',
      source: 'Rock Content',
      published_at: new Date(Date.now() - 172800000).toISOString(),
      category: 'redes sociais'
    },
    {
      id: 'news-4',
      title: 'IA generativa revoluciona criação de conteúdo',
      summary: 'Ferramentas de inteligência artificial estão transformando a forma como marcas produzem conteúdo para redes sociais.',
      url: 'https://exame.com',
      source: 'Exame',
      published_at: new Date(Date.now() - 259200000).toISOString(),
      category: 'tecnologia'
    },
  ];

  // Adicionar notícias específicas do segmento
  const segmentNews: Record<string, any[]> = {
    'ecommerce': [
      {
        id: 'news-seg-1',
        title: 'Black Friday 2026: Tendências e previsões',
        summary: 'Especialistas apontam estratégias para lojistas online aproveitarem a data comercial mais importante do ano.',
        url: 'https://ecommercebrasil.com.br',
        source: 'E-commerce Brasil',
        published_at: new Date(Date.now() - 86400000).toISOString(),
        category: 'e-commerce'
      }
    ],
    'food': [
      {
        id: 'news-seg-1',
        title: 'Delivery de comida cresce 25% no primeiro semestre',
        summary: 'Apps de delivery registram aumento significativo de pedidos, com destaque para comida saudável.',
        url: 'https://forbes.com.br',
        source: 'Forbes',
        published_at: new Date(Date.now() - 86400000).toISOString(),
        category: 'alimentação'
      }
    ],
    'beauty': [
      {
        id: 'news-seg-1',
        title: 'Skincare brasileiro conquista mercado internacional',
        summary: 'Marcas nacionais de cosméticos ganham destaque em mercados da Europa e Estados Unidos.',
        url: 'https://forbes.com.br',
        source: 'Forbes',
        published_at: new Date(Date.now() - 86400000).toISOString(),
        category: 'beleza'
      }
    ]
  };

  return [...baseNews, ...(segmentNews[segment] || [])];
}
