import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { analyzeSentiment, analyzeBatchSentiment, analyzeSocialMediaSentiment } from '@/lib/integrations/openai/sentiment';

export const dynamic = 'force-dynamic';

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
    const { type, data } = body;

    // Buscar API key da OpenAI
    const { data: config } = await supabase
      .from('integration_configs')
      .select('api_key')
      .eq('integration_id', 'openai')
      .single();

    const apiKey = config?.api_key || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenAI não configurada',
        details: 'Configure a API Key da OpenAI nas integrações'
      }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'single':
        // Análise de um único texto
        if (!data.text) {
          return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
        }
        result = await analyzeSentiment({
          text: data.text,
          context: data.context,
          language: data.language
        }, apiKey);
        break;

      case 'batch':
        // Análise de múltiplos textos
        if (!data.texts || !Array.isArray(data.texts)) {
          return NextResponse.json({ error: 'Array de textos é obrigatório' }, { status: 400 });
        }
        result = await analyzeBatchSentiment(
          data.texts.map((text: string) => ({ text, context: data.context })),
          apiKey
        );
        break;

      case 'social':
        // Análise de posts de redes sociais
        if (!data.posts || !Array.isArray(data.posts)) {
          return NextResponse.json({ error: 'Array de posts é obrigatório' }, { status: 400 });
        }
        result = await analyzeSocialMediaSentiment(data.posts, apiKey);
        break;

      default:
        return NextResponse.json({ error: 'Tipo de análise inválido' }, { status: 400 });
    }

    // Registrar uso
    await supabase.from('integration_logs').insert({
      integration_id: 'openai',
      action: `sentiment_${type}`,
      status: 'success',
      request_data: { type, dataSize: JSON.stringify(data).length },
      response_data: { hasResult: !!result }
    });

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('Erro na análise de sentimento:', error);
    return NextResponse.json({ 
      error: 'Erro na análise',
      details: error.message 
    }, { status: 500 });
  }
}

// GET para análise rápida de texto via query param
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text) {
      return NextResponse.json({ error: 'Parâmetro text é obrigatório' }, { status: 400 });
    }

    const { data: config } = await supabase
      .from('integration_configs')
      .select('api_key')
      .eq('integration_id', 'openai')
      .single();

    const apiKey = config?.api_key || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenAI não configurada'
      }, { status: 400 });
    }

    const result = await analyzeSentiment({ text }, apiKey);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('Erro na análise de sentimento:', error);
    return NextResponse.json({ 
      error: 'Erro na análise',
      details: error.message 
    }, { status: 500 });
  }
}






