/**
 * Valle 360 - API de Pesquisa Web
 * Usa Tavily para buscar informações em tempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { tavilyClient } from '@/lib/integrations/tavily/client';

export const dynamic = 'force-dynamic';

// POST - Pesquisa web
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, query, options } = body;

    if (!type || !query) {
      return NextResponse.json({ error: 'type e query são obrigatórios' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'general':
        result = await tavilyClient.search({
          query,
          searchDepth: options?.searchDepth || 'basic',
          maxResults: options?.maxResults || 10,
          includeAnswer: true
        });
        break;

      case 'news':
        result = await tavilyClient.searchNews(query, options?.maxResults || 10);
        break;

      case 'company':
        result = await tavilyClient.searchCompany(query);
        break;

      case 'competitors':
        result = await tavilyClient.searchCompetitors(
          query,
          options?.location,
          options?.excludeCompany
        );
        break;

      case 'trends':
        result = await tavilyClient.searchTrends(query);
        break;

      case 'social':
        result = await tavilyClient.searchSocialMedia(query);
        break;

      case 'reputation':
        result = await tavilyClient.searchReputation(query);
        break;

      default:
        return NextResponse.json({ error: 'Tipo de pesquisa inválido' }, { status: 400 });
    }

    // Registrar pesquisa (ignorar erro se tabela não existir)
    try {
      await supabase.from('search_logs').insert({
        user_id: user.id,
        search_type: type,
        query,
        results_count: result.results.length,
        response_time: result.responseTime
      });
    } catch {
      // Ignorar erro silenciosamente
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('Erro na pesquisa web:', error);
    return NextResponse.json({ 
      error: 'Erro na pesquisa',
      details: error.message 
    }, { status: 500 });
  }
}

